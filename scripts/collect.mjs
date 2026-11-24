// 부산 지원사업 공고 수집기. 의존성 없음 (Node 18+). 실행: node scripts/collect.mjs
// 기관별로 실패해도 다른 기관은 계속 수집하고, 실패한 기관은 이전 결과를 유지한 채 오류를 기록한다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../data/notices.json', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const kst = () => new Date(Date.now() + 9 * 3600e3);
const today = () => kst().toISOString().slice(0, 10);

async function get(url, tries = 3) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', Accept: '*/*' }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) { err = e; await sleep(1500 * (i + 1)); }
  }
  throw err;
}
const decode = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const dot = s => s.replace(/\./g, '-');

/* ---- 부산소상공인지원센터: 공개 JSON API ---- */
async function bsbsc() {
  const out = [];
  for (const page of [1, 2]) {
    const j = JSON.parse(await get(`https://bsbsc.kr/api/v1/business_posting?page=${page}&size=20`));
    if (!Array.isArray(j.payload)) throw new Error('응답 형식이 바뀐 것 같습니다 (payload 없음)');
    for (const p of j.payload) {
      if (p.showYn === false || p.postingStatusNm !== '접수중') continue;
      out.push({ id: 'bsbsc-' + p.id, title: p.title, program: p.businessNm || '', start: (p.registerFr || '').slice(0, 10), deadline: (p.registerTo || '').slice(0, 10), url: `https://bsbsc.kr/posting/${p.id}` });
    }
    await sleep(500);
  }
  return out;
}

/* ---- 부산테크노파크: 사업공고 게시판(MN013) HTML ---- */
async function btp() {
  const out = [];
  for (const page of [1, 2, 3]) {
    const h = await get(`https://www.btp.or.kr/kor/CMS/Board/Board.do?mCode=MN013&mgr_seq=16&page=${page}`);
    const rows = h.split(/<tr\b/).slice(1).filter(r => r.includes('board_seq='));
    if (!rows.length) { if (page === 1) throw new Error('게시판 행을 찾지 못했습니다 (구조 변경 또는 차단)'); break; }
    for (const r of rows) {
      const seq = (r.match(/board_seq=(\d+)/) || [])[1];
      const title = decode((r.match(/class="subjectWr">([\s\S]*?)<\/span>\s*<\/a>/) || [])[1] || '').replace(/^(재공고|정정|연장)\s*/, '');
      const per = r.match(/(\d{4}\.\d{2}\.\d{2})\s*~\s*(\d{4}\.\d{2}\.\d{2})/);
      const open = /status st1/.test(r);
      if (!seq || !title || !per || !open) continue;
      out.push({ id: 'btp-' + seq, title, program: '', start: dot(per[1]), deadline: dot(per[2]), url: `https://www.btp.or.kr/kor/CMS/Board/Board.do?mCode=MN013&mgr_seq=16&mode=view&board_seq=${seq}` });
    }
    await sleep(1200);
  }
  return out;
}

const SOURCES = [
  { id: 'bsbsc', name: '부산소상공인지원센터', run: bsbsc },
  { id: 'btp', name: '부산테크노파크', run: btp },
];

let prev = { items: [], sources: [] };
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

const items = [], sources = [];
for (const s of SOURCES) {
  try {
    const got = [...new Map((await s.run()).map(x => [x.id, x])).values()].filter(x => !x.deadline || x.deadline >= today());
    got.forEach(x => items.push({ ...x, source: s.id, sourceName: s.name }));
    sources.push({ id: s.id, name: s.name, ok: true, count: got.length });
    console.log(`OK   ${s.name}: ${got.length}건`);
  } catch (e) {
    const keep = (prev.items || []).filter(x => x.source === s.id && (!x.deadline || x.deadline >= today()));
    items.push(...keep);
    sources.push({ id: s.id, name: s.name, ok: false, count: keep.length, error: String(e.message || e).slice(0, 160) });
    console.error(`FAIL ${s.name}: ${e.message} (이전 결과 ${keep.length}건 유지)`);
  }
}

// 처음 본 공고에 firstSeen을 달아 "새 공고"를 구분한다
const seen = new Map((prev.items || []).map(x => [x.id, x.firstSeen]));
items.forEach(x => { x.firstSeen = seen.get(x.id) || today(); });
items.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));

const anyOk = sources.some(s => s.ok);
const next = { updatedAt: anyOk ? kst().toISOString().slice(0, 19) + '+09:00' : prev.updatedAt || null, sources, items };
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
// updatedAt만 달라진 경우에도 기록은 남기되, 내용 변화가 없으면 날짜만 갱신
await writeFile(OUT, JSON.stringify(next, null, 1) + '\n');
console.log(`합계 ${items.length}건`);
if (!anyOk) process.exit(1);
