// 사막 생존 게임 웹앱 서버. 의존성 없음. 상태는 메모리에 두고 JSON 파일로 저장한다.
// 환경변수: PORT(기본 8081), ADMIN_PIN(진행자 PIN, 없으면 실행 시 무작위 생성해 로그에 출력), DATA_DIR(기본 ./data)
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ITEMS, ANSWER, ANSWER_IDS } from './items.mjs';
import { isValidRanking, errorScore, teamResult } from './scoring.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8081;
const DATA_DIR = process.env.DATA_DIR || join(here, 'data');
const ADMIN_PIN = process.env.ADMIN_PIN || String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000));
const MAX_TEAMS = 10, MAX_MEMBERS = 200, PHASES = ['individual', 'team', 'result'];

const fresh = () => ({ phase: 'individual', members: {}, teams: {} });
let state = fresh();
try { state = JSON.parse(await readFile(join(DATA_DIR, 'state.json'), 'utf8')); } catch { /* 새로 시작 */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await mkdir(DATA_DIR, { recursive: true }); await writeFile(join(DATA_DIR, 'state.json'), JSON.stringify(state)); } catch (e) { console.error('save failed', e.message); }
  }, 300);
}

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'],
};
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const fail = (res, code, msg) => json(res, code, { error: msg });
async function body(req) {
  let n = 0; const chunks = [];
  for await (const c of req) { n += c.length; if (n > 20000) throw new Error('too large'); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new Error('bad json'); }
}
// PIN 대입 공격 완화: 최근 1분간 실패가 20회를 넘으면 잠시 차단
let pinFails = [];
function pinBlocked() { const now = Date.now(); pinFails = pinFails.filter((t) => now - t < 60000); return pinFails.length >= 20; }
function pinOk(pin) {
  const a = Buffer.from(String(pin ?? '')), b = Buffer.from(ADMIN_PIN);
  return a.length === b.length && timingSafeEqual(a, b);
}
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const teamMembers = (team) => Object.values(state.members).filter((m) => m.team === team);

function computeTeam(team) {
  const ms = teamMembers(team), t = state.teams[team];
  const submitted = ms.filter((m) => m.individual);
  const out = { team, memberCount: ms.length, individualSubmitted: submitted.length, teamSubmitted: !!t?.ranking,
    minorityAdopted: !!t?.minorityAdopted, minorityNote: t?.minorityNote || '', spokenCount: t?.spokenCount ?? null };
  if (t?.ranking && ms.length) {
    out.result = teamResult({ members: submitted.map((m) => m.individual.ranking), team: t.ranking, memberCount: ms.length, spokenCount: t.spokenCount ?? null, minorityAdopted: !!t.minorityAdopted });
  }
  return out;
}
function allTeams() {
  const ids = new Set([...Object.values(state.members).map((m) => m.team), ...Object.keys(state.teams).map(Number)]);
  return [...ids].sort((a, b) => a - b).map(computeTeam);
}
function scoreboard() {
  const teams = allTeams().filter((t) => t.result).sort((a, b) => b.result.total - a.result.total);
  const pending = allTeams().filter((t) => !t.result).map((t) => t.team);
  return { teams, pending, answer: ANSWER.map((a) => ({ ...a, name: ITEMS.find((i) => i.id === a.id).name })) };
}
// 팀 안에서 의견이 가장 갈린 물건(순위 편차가 큰 순)과 평균 순서
function disagreement(team) {
  const rs = teamMembers(team).filter((m) => m.individual).map((m) => m.individual.ranking);
  if (!rs.length) return { avgOrder: ITEMS.map((i) => i.id), contested: [] };
  const rows = ITEMS.map((it) => {
    const pos = rs.map((r) => r.indexOf(it.id) + 1);
    const mean = pos.reduce((a, b) => a + b, 0) / pos.length;
    const sd = Math.sqrt(pos.reduce((a, b) => a + (b - mean) ** 2, 0) / pos.length);
    return { id: it.id, name: it.name, mean, sd, min: Math.min(...pos), max: Math.max(...pos) };
  });
  return {
    avgOrder: [...rows].sort((a, b) => a.mean - b.mean).map((r) => r.id),
    contested: rows.length && rs.length > 1 ? [...rows].sort((a, b) => b.sd - a.sd).slice(0, 3).map(({ id, name, min, max }) => ({ id, name, min, max })) : [],
  };
}

async function api(req, res, path, url) {
  if (path === '/api/items' && req.method === 'GET') return json(res, 200, { items: ITEMS });
  if (path === '/api/state' && req.method === 'GET') {
    const me = state.members[url.searchParams.get('id')];
    const out = { phase: state.phase, me: null };
    if (me) {
      const mates = teamMembers(me.team);
      out.me = { id: me.id, name: me.name, team: me.team, individual: me.individual ? { ranking: me.individual.ranking, reason: me.individual.reason, error: state.phase === 'result' ? errorScore(me.individual.ranking) : undefined } : null };
      out.team = { team: me.team, members: mates.map((m) => ({ name: m.name, submitted: !!m.individual })), consensus: state.teams[me.team]?.ranking || null,
        minorityAdopted: !!state.teams[me.team]?.minorityAdopted, minorityNote: state.teams[me.team]?.minorityNote || '' };
      if (state.phase !== 'individual') Object.assign(out.team, disagreement(me.team));
    }
    return json(res, 200, out);
  }
  if (path === '/api/results' && req.method === 'GET') {
    if (state.phase !== 'result') return fail(res, 403, '아직 결과가 공개되지 않았어요');
    return json(res, 200, scoreboard());
  }
  if (req.method !== 'POST') return fail(res, 405, 'method not allowed');
  let b; try { b = await body(req); } catch (e) { return fail(res, 400, e.message); }

  if (path === '/api/join') {
    const name = clean(b.name, 20), team = Number(b.team);
    if (!name) return fail(res, 400, '이름을 입력해 주세요');
    if (!Number.isInteger(team) || team < 1 || team > MAX_TEAMS) return fail(res, 400, `팀은 1~${MAX_TEAMS}번 중에서 골라 주세요`);
    // 같은 이름·같은 팀으로 다시 들어오면 기존 참가자로 이어서 진행
    const prev = Object.values(state.members).find((m) => m.team === team && m.name === name);
    if (prev) return json(res, 200, { id: prev.id, resumed: true });
    if (Object.keys(state.members).length >= MAX_MEMBERS) return fail(res, 400, '참가 인원이 가득 찼어요');
    const id = randomBytes(8).toString('hex');
    state.members[id] = { id, name, team, individual: null };
    save(); return json(res, 200, { id });
  }
  if (path === '/api/individual') {
    const m = state.members[b.id];
    if (!m) return fail(res, 404, '참가 정보를 찾을 수 없어요. 다시 입장해 주세요');
    if (state.phase !== 'individual') return fail(res, 409, '개인 순위 입력 시간이 끝났어요');
    if (!isValidRanking(b.ranking)) return fail(res, 400, '15개 물건의 순위가 올바르지 않아요');
    m.individual = { ranking: b.ranking, reason: clean(b.reason, 80), at: Date.now() };
    save(); return json(res, 200, { ok: true });
  }
  if (path === '/api/team') {
    const m = state.members[b.id];
    if (!m) return fail(res, 404, '참가 정보를 찾을 수 없어요. 다시 입장해 주세요');
    if (state.phase !== 'team') return fail(res, 409, '지금은 팀 합의 시간이 아니에요');
    if (!isValidRanking(b.ranking)) return fail(res, 400, '15개 물건의 순위가 올바르지 않아요');
    const prev = state.teams[m.team] || {};
    state.teams[m.team] = { ...prev, ranking: b.ranking, minorityAdopted: !!b.minorityAdopted, minorityNote: clean(b.minorityNote, 100), submittedBy: m.name, at: Date.now() };
    save(); return json(res, 200, { ok: true });
  }
  if (path === '/api/admin') {
    if (pinBlocked()) return fail(res, 429, '시도가 너무 많아요. 1분 뒤에 다시 해 주세요');
    if (!pinOk(b.pin)) { pinFails.push(Date.now()); return fail(res, 401, 'PIN이 맞지 않아요'); }
    switch (b.action) {
      case 'overview': break;
      case 'setPhase':
        if (!PHASES.includes(b.phase)) return fail(res, 400, 'bad phase');
        state.phase = b.phase; save(); break;
      case 'setSpoken': {
        const team = Number(b.team), n = Number(b.spokenCount);
        if (!Number.isInteger(team) || !(b.spokenCount === null || (Number.isInteger(n) && n >= 0 && n <= MAX_MEMBERS))) return fail(res, 400, 'bad value');
        state.teams[team] = { ...(state.teams[team] || {}), spokenCount: b.spokenCount === null ? null : n }; save(); break;
      }
      case 'setMinority': {
        const team = Number(b.team);
        state.teams[team] = { ...(state.teams[team] || {}), minorityAdopted: !!b.value }; save(); break;
      }
      case 'removeMember': delete state.members[b.id]; save(); break;
      case 'reset': state = fresh(); save(); break;
      default: return fail(res, 400, 'unknown action');
    }
    return json(res, 200, { phase: state.phase, teams: allTeams(), members: Object.values(state.members).map((m) => ({ id: m.id, name: m.name, team: m.team, submitted: !!m.individual })), answer: ANSWER_IDS });
  }
  return fail(res, 404, 'not found');
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), path = url.pathname;
  try {
    if (path.startsWith('/api/')) return await api(req, res, path, url);
    if (/^\/img\/[a-z0-9-]+\.(jpg|png)$/.test(path) && (req.method === 'GET' || req.method === 'HEAD')) {
      const img = await readFile(join(here, 'public', path.slice(1))).catch(() => null);
      if (!img) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': path.endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      res.end(req.method === 'HEAD' ? undefined : img); return;
    }
    const hit = STATIC[path];
    if (!hit || (req.method !== 'GET' && req.method !== 'HEAD')) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); return; }
    const file = await readFile(join(here, 'public', hit[0]));
    res.writeHead(200, { 'Content-Type': hit[1], 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : file);
  } catch (e) { console.error(e); if (!res.headersSent) fail(res, 500, 'server error'); }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`사막 생존 게임 서버: http://localhost:${PORT}`);
  console.log(process.env.ADMIN_PIN ? '진행자 PIN: 환경변수 ADMIN_PIN 값' : `진행자 PIN(이번 실행 한정): ${ADMIN_PIN}`);
});
