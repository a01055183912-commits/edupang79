'use strict';
const $app = document.getElementById('app');
const $who = document.getElementById('who');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
};
const PHASE_NAME = { individual: '1단계 · 혼자 정하기', team: '2단계 · 팀이 하나로', result: '3단계 · 결과 확인', story: '4단계 · 우리 팀 이야기' };

const TEAMS = [['낙타', '🐪'], ['선인장', '🌵'], ['전갈', '🦂'], ['도마뱀', '🦎'], ['독수리', '🦅'], ['방울뱀', '🐍'], ['사막여우', '🦊'], ['거북이', '🐢'], ['오아시스', '🌴'], ['태양', '☀️']];
let names = {};   // 팀 번호 → 사용자가 정한 팀 이름
let lobby = null; // 입장 화면용: 팀 수, 팀당 인원, 팀별 현재 인원
const teamName = (n) => names[n] || TEAMS[n - 1]?.[0] || `${n}팀`;
const teamTag = (n) => `${TEAMS[n - 1]?.[1] || ''} ${teamName(n)}`;
const teamFull = (n) => `${TEAMS[n - 1]?.[1] || ''} ${n}팀 · ${teamName(n)}`;
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastMoved = -1, resultConfetti = false;

function stepper(phase) {
  const steps = [['individual', '🤫', '혼자'], ['team', '🗣️', '팀'], ['result', '🚁', '결과'], ['story', '📖', '이야기']];
  const at = steps.findIndex((x) => x[0] === phase);
  return `<ol class="steps" aria-label="진행 단계">${steps.map((x, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}" ${i === at ? 'aria-current="step"' : ''}><span class="ic" aria-hidden="true">${x[1]}</span>${x[2]}</li>`).join('')}</ol>`;
}
function hero(src, alt, line) {
  return `<figure class="hero"><img src="/img/${src}" alt="${esc(alt)}" width="720" loading="eager">${line ? `<figcaption>${line}</figcaption>` : ''}</figure>`;
}
function waiting(text) {
  return `<div class="wait" role="status"><span class="sand" aria-hidden="true">⏳</span><div><b>${text}</b><div class="hint">진행자가 다음 단계로 넘기면 화면이 저절로 바뀌어요.</div></div></div>`;
}
function confetti() {
  if (reduceMotion()) return;
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
  document.body.appendChild(cv);
  const dpr = window.devicePixelRatio || 1, W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr), g = cv.getContext('2d');
  const cols = ['#C8553D', '#E0A43B', '#2E86AB', '#4C8C4A', '#F6EBD6'];
  const ps = [...Array(110)].map(() => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 14 - 4) * dpr, r: (4 + Math.random() * 6) * dpr, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6 }));
  let t = 0;
  (function tick() {
    g.clearRect(0, 0, W, H);
    ps.forEach((p) => { p.vy += 0.45 * dpr; p.x += p.vx; p.y += p.vy; p.a += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); });
    if (++t < 110) requestAnimationFrame(tick); else cv.remove();
  })();
}

const FB_QS = [
  ['q1', '🗣️', '나는 내 의견을 끝까지 말했다', ['🙊', '🤐', '🙂', '🗣️', '📣'], '조용히 지나갔어요', '목소리를 한껏 냈어요', '끝까지 말하기'],
  ['q2', '👂', '나는 다른 사람 이야기를 끝까지 들었다', ['😴', '🙉', '🙂', '👂', '🐘'], '자꾸 딴생각했어요', '코끼리 귀로 들었어요', '끝까지 듣기'],
  ['q3', '🌱', '내 의견이 팀 결정에 반영됐다고 느낀다', ['🥀', '🌱', '🌿', '🌳', '🌴'], '시들시들했어요', '무럭무럭 자랐어요', '내 의견 반영'],
  ['q4', '🤝', '의견이 달랐을 때 기분 좋게 설득하거나 양보했다', ['🥊', '😬', '🙂', '🤝', '🥳'], '팽팽했어요', '웃으며 맞췄어요', '설득·양보'],
];
const WEATHER = [['sunny', '☀️', '맑음'], ['cloudy', '⛅', '구름'], ['rainy', '🌧️', '비'], ['storm', '⛈️', '폭풍']];
const TOMORROW = [['ask', '“어떻게 생각하세요?” 물어봐 주기'], ['listen', '끝까지 듣고 고개 끄덕이기'], ['praise', '다정하게 말하고 “오~” 인정하기'], ['speak', '내 의견을 끝까지 말해보기'], ['yield', '기분 좋게 양보하기']];
const STORY_CHIPS = {
  crisis: ['의견이 팽팽하게 갈린 순간', '누군가 “걸어가자”고 한 순간', '정답이 안 보여 막막한 순간', '시간이 모자랐던 순간', '아무도 말을 못 꺼낸 순간'],
  twist: ['막내의 한마디', '질문 하나', '기분 좋은 양보', '터져 나온 웃음', '메모 한 줄'],
  ending: ['모두가 납득하는 순위를 만들었다', '아쉽지만 서로를 더 알게 됐다', '다음엔 더 잘할 수 있겠다고 느꼈다', '구조 헬기가 우리를 발견했다'],
};
function feltVsActual(q3, percent) {
  if (q3 >= 4 && percent >= 65) return ['🌳', '느낌도 숫자도 든든해요! 내 의견이 팀에 잘 닿았어요.'];
  if (q3 >= 4) return ['🤔', '반영됐다고 느꼈지만 숫자는 조금 달라요. 서로의 생각을 충분히 나눠 들었는지 이야기해 봐요.'];
  if (q3 <= 2 && percent < 65) return ['🌱', '서운했을 수 있어요. 반영되지 않은 물건을 이유와 함께 팀에 다시 꺼내 볼까요?'];
  if (q3 <= 2) return ['🎁', '생각보다 내 의견이 많이 담겼어요! 말하지 못한 마음이 있다면 팀과 나눠 봐요.'];
  return ['⚖️', '반반이에요. 어떤 물건에서 의견이 갈렸는지 함께 돌아봐요.'];
}
function composeStory(t, data) {
  const sd = data.story;
  const name = `${TEAMS[t - 1]?.[1] || ''} ${teamName(t)} 탐험대`;
  if (!sd || (!sd.crisis && !sd.twist && !sd.ending && !sd.free)) return `<span class="hint">아직 팀 이야기가 없어요. 위에서 위기·반전·결말을 골라 우리 팀 이야기를 완성해 보세요!</span>`;
  const parts = [sd.crisis && `<b>${esc(sd.crisis)}</b>`, sd.twist && `<b>${esc(sd.twist)}</b> 덕분에`, sd.ending && `<b>${esc(sd.ending)}</b>`].filter(Boolean);
  const sentence = `<b>${esc(name)}</b>의 이야기: ${parts.join(', ')}${sd.ending ? '.' : '…'}`;
  return `<p class="story">${sentence}</p>${sd.free ? `<p class="storyfree">“${esc(sd.free)}”</p>` : ''}`;
}
function storyCard(data) {
  const t = data.team, f = data.feedback, W = Object.fromEntries(WEATHER.map((w) => [w[0], w]));
  const wTxt = WEATHER.filter((w) => f.weather[w[0]]).map((w) => `${w[1]} ${w[2]} ${f.weather[w[0]]}`).join('  ');
  const tm = TOMORROW.filter((x) => f.tomorrow[x[0]]).map((x) => `<span>${esc(x[1])} · ${f.tomorrow[x[0]]}</span>`).join('');
  const rf = data.reflect;
  return `<div class="card storycard"><div class="row"><b style="font-size:20px">${teamFull(t)}</b>${data.total !== null ? `<span style="margin-left:auto;font-weight:700">${data.total}점</span>` : ''}</div>
    ${composeStory(t, data)}
    <div class="hint">설문 ${f.count}/${data.memberCount}명 참여${wTxt ? ` · 대화 날씨: ${wTxt}` : ''}</div>
    ${f.count ? FB_QS.map((q) => `<div class="meter"><span class="ml">${q[1]} ${esc(q[6])}</span><span class="mb"><i style="width:${(f.avg[q[0]] || 0) * 20}%"></i></span><span class="mv2">${f.avg[q[0]]}</span></div>`).join('') : ''}
    ${rf ? `<div class="hint">🧭 팀 평균 의견 반영도 <b>${rf.avg}%</b>${rf.max - rf.min >= 30 ? ' · 팀원마다 반영된 정도가 꽤 달랐어요. 목소리가 작게 담긴 사람은 없었는지 이야기해 봐요.' : ' · 팀원들의 의견이 고르게 담겼어요.'}</div>` : ''}
    ${data.contested?.length ? `<div class="hint">⚡ 가장 의견이 갈린 물건: ${data.contested.map((c) => esc(c.name)).join(', ')}</div>` : ''}
    ${data.minorityNote ? `<div class="hint">🌟 바뀐 순위의 주인공: ${esc(data.minorityNote)}</div>` : ''}
    ${f.oneLines.length ? `<div class="hint"><b>오늘 우리 팀을 살린 한마디 (익명)</b></div><div class="pills">${f.oneLines.map((l) => `<span>“${esc(l)}”</span>`).join('')}</div>` : ''}
    ${tm ? `<div class="hint"><b>내일 일터에서 해볼 한 가지</b></div><div class="pills">${tm}</div>` : ''}</div>`;
}

let items = [], itemMap = {};
let myId = store.get('ds_id');
let st = null;            // 서버 상태
let draft = null;         // 입력 중인 내용 {phase, ranking, reason, minorityAdopted, minorityNote}
let msg = null;           // {type:'err'|'ok', text}
let results = null;
let sig = '';
let adminPin = null;      // 진행자 PIN(세션 동안만 메모리에 보관)
let admin = null;         // 진행자 개요
let joinTeam = (() => { const n = Number(new URLSearchParams(location.search).get('team')); return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null; })();
let joinName = '';
let qrBase = store.get('ds_qr_url') || '', qrFull = false, printSheet = false;

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '요청에 실패했어요');
  return data;
}
const isAdmin = () => location.hash === '#admin';
const banner = () => (msg ? `<div class="${msg.type === 'err' ? 'err' : 'ok'}" role="alert">${esc(msg.text)}</div>` : '');

// ---------- 순위 목록 ----------
function rankList(ranking, editable) {
  return `<ol class="rank">${ranking.map((id, i) => `
    <li class="${i === lastMoved ? 'pop' : ''}"><span class="no">${i + 1}</span><img class="pic" src="/img/item-${esc(id)}.jpg" alt="" width="64" height="44" loading="lazy"><span class="nm">${esc(itemMap[id].name)}</span>
    ${editable ? `<span class="mv"><button data-mv="${i}" data-d="-1" aria-label="${esc(itemMap[id].name)} 한 칸 위로" ${i === 0 ? 'disabled' : ''}>▲</button><button data-mv="${i}" data-d="1" aria-label="${esc(itemMap[id].name)} 한 칸 아래로" ${i === ranking.length - 1 ? 'disabled' : ''}>▼</button></span>` : ''}</li>`).join('')}</ol>`;
}
function bindRank(onChange) {
  $app.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.mv), j = i + Number(b.dataset.d), r = draft.ranking;
    if (j < 0 || j >= r.length) return;
    [r[i], r[j]] = [r[j], r[i]];
    lastMoved = j; msg = null; onChange();
  }));
}

// ---------- 화면 ----------
function viewJoin() {
  $who.textContent = '';
  const L = lobby || { teamCount: 5, teamSize: 6, teams: [...Array(5)].map((_, i) => ({ team: i + 1, count: 0 })) };
  $app.innerHTML = `${banner()}${hero('crash.jpg', '사막에 불시착한 비행기 옆에서 땀을 흘리는 탐험가', '비행기가 사막에 뚝! 🏜️ 43도 한낮, 우리는 살아남을 수 있을까?')}<h1>탐험대 입장</h1>
    <p class="sub">이름을 쓰고 우리 팀을 눌러 주세요. 같은 이름·같은 팀으로 다시 들어오면 이어서 할 수 있어요.</p>
    <label for="nm">이름</label><input id="nm" type="text" maxlength="20" autocomplete="off" value="${esc(joinName)}" placeholder="예: 홍길동">
    <label id="tl">우리 탐험대</label><div class="teamlist" role="group" aria-labelledby="tl">${L.teams.map((t) => { const full = t.count >= L.teamSize && joinTeam !== t.team;
      return `<button type="button" data-team="${t.team}" aria-pressed="${joinTeam === t.team}" ${full ? 'disabled' : ''}><span class="te">${TEAMS[t.team - 1][1]}</span><span class="tn"><b>${t.team}팀</b> ${esc(teamName(t.team))}</span><span class="tc">${full ? '가득 참' : `${t.count}/${L.teamSize}명`}</span></button>`; }).join('')}</div>
    <button class="btn" id="go">탐험 시작!</button>`;
  $app.querySelector('#nm').addEventListener('input', (e) => { joinName = e.target.value; });
  $app.querySelectorAll('[data-team]').forEach((b) => b.addEventListener('click', () => { joinTeam = Number(b.dataset.team); viewJoin(); }));
  $app.querySelector('#go').addEventListener('click', async () => {
    try {
      if (!joinTeam) throw new Error('우리 팀을 눌러 주세요');
      const r = await api('/api/join', { name: joinName, team: joinTeam });
      myId = r.id; store.set('ds_id', myId); msg = null; draft = null; await refresh(true);
    } catch (e) { msg = { type: 'err', text: e.message }; await refresh(true); }
  });
}

function nameCard() {
  const t = st.me.team;
  return `<div class="card"><label for="tname" style="margin-top:0">우리 팀 이름 <span class="hint">(팀원 누구나 정할 수 있어요)</span></label>
    <div class="row"><input id="tname" type="text" maxlength="12" value="${esc(names[t] || '')}" placeholder="예: ${esc(TEAMS[t - 1]?.[0] || '불사조')}" style="flex:1"><button class="btn small" id="tsave" style="margin:0">저장</button></div></div>`;
}
function bindName() {
  const save = $app.querySelector('#tsave');
  if (!save) return;
  save.addEventListener('click', async () => {
    try { await api('/api/teamname', { id: myId, name: $app.querySelector('#tname').value }); msg = null; await refresh(true); }
    catch (e) { msg = { type: 'err', text: e.message }; render(); }
  });
}

function viewIndividual() {
  const me = st.me, submitted = !!me.individual;
  $app.innerHTML = `${banner()}${stepper('individual')}${hero('shh.jpg', '입술에 손가락을 대고 조용히 답을 적는 탐험가', 'Shh! 아직 옆 사람과 이야기하면 안 돼요')}<span class="chip">${PHASE_NAME.individual}</span><h1>조용히 나만의 답 정하기</h1>${nameCard()}
    <p class="sub">아직 옆 사람과 이야기하지 마세요. 살아남는 데 가장 중요한 물건부터 1위~15위 순서로 ▲▼ 버튼으로 정해 보세요.</p>
    ${rankList(draft.ranking, true)}
    <label for="why">왜 이걸 1위로 했나요? (선택)</label><input id="why" type="text" maxlength="80" value="${esc(draft.reason)}" placeholder="나만의 이유를 한 줄로">
    <button class="btn" id="sub">${submitted ? '다시 제출하기' : '🪞 내 순위 제출하기'}</button>
    ${submitted ? waiting('제출 완료! 다른 탐험대원을 기다리는 중…') + '<div class="hint">바꾸고 싶으면 위에서 순서를 고쳐 다시 제출할 수 있어요.</div>' : ''}`;
  bindRank(viewIndividual); bindName();
  $app.querySelector('#why').addEventListener('input', (e) => { draft.reason = e.target.value; });
  $app.querySelector('#sub').addEventListener('click', async () => {
    try { await api('/api/individual', { id: myId, ranking: draft.ranking, reason: draft.reason }); lastMoved = -1; msg = null; confetti(); await refresh(true); }
    catch (e) { msg = { type: 'err', text: e.message }; viewIndividual(); }
  });
}

function viewTeam() {
  const t = st.team, nm = (id) => esc(itemMap[id]?.name || id);
  $app.innerHTML = `${banner()}${stepper('team')}${hero('talk.jpg', '둥근 탁자에 둘러앉아 이야기하는 탐험대', '투표 금지! 가위바위보 금지! 이야기로만 정해요')}<span class="chip">${PHASE_NAME.team}</span><h1>${teamFull(t.team)}, 이야기로!</h1>${nameCard()}
    <p class="sub">다수결·가위바위보는 금지! 직급·연차 말고 ‘이유’로 이야기하세요. <b>기록 담당 1명</b>만 팀 순위를 제출해 주세요.</p>
    <div class="card"><b>우리 팀</b><div class="pills">${t.members.map((m) => `<span class="${m.submitted ? 'done' : ''}">${esc(m.name)}</span>`).join('')}</div></div>
    ${t.contested?.length ? `<div class="card sky"><b>의견이 가장 갈린 물건</b><div class="pills">${t.contested.map((c) => `<span>${nm(c.id)} · ${c.min}위~${c.max}위</span>`).join('')}</div><div class="hint" style="color:#fff">여기부터 이야기해 보세요. 처음 순서는 팀원 순위의 평균이에요.</div></div>` : ''}
    ${rankList(draft.ranking, true)}
    <div class="card"><label style="margin-top:0"><input type="checkbox" id="min" ${draft.minorityAdopted ? 'checked' : ''}> 조용하거나 막내 팀원의 의견 덕분에 바뀐 순위가 있어요</label>
    <input id="note" type="text" maxlength="100" value="${esc(draft.minorityNote)}" placeholder="어떤 의견이었나요? (예: 신입이 거울을 1위로 제안)" style="margin-top:8px"></div>
    <button class="btn" id="sub">${t.consensus ? '팀 순위 다시 제출하기' : '🚁 팀 순위 제출하기'}</button>
    ${t.consensus ? waiting('팀 순위 제출 완료! 결과 발표를 기다리는 중…') : ''}
    <details class="card"><summary><b>내 개인 순위 보기</b></summary>${st.me.individual ? rankList(st.me.individual.ranking, false) : '<p class="hint">제출한 개인 순위가 없어요.</p>'}</details>`;
  bindRank(viewTeam); bindName();
  $app.querySelector('#min').addEventListener('change', (e) => { draft.minorityAdopted = e.target.checked; });
  $app.querySelector('#note').addEventListener('input', (e) => { draft.minorityNote = e.target.value; });
  $app.querySelector('#sub').addEventListener('click', async () => {
    try { await api('/api/team', { id: myId, ranking: draft.ranking, minorityAdopted: draft.minorityAdopted, minorityNote: draft.minorityNote }); lastMoved = -1; msg = null; confetti(); await refresh(true); }
    catch (e) { msg = { type: 'err', text: e.message }; viewTeam(); }
  });
}

function breakdownBar(r) {
  const seg = [['정확도', r.accuracy, 'var(--dk)'], ['시너지', r.synergy, 'var(--sky)'], ['발언', r.speak, 'var(--gold)'], ['소수 의견', r.minority, 'var(--green)']];
  return `<div class="bar" role="img" aria-label="${seg.map((s) => `${s[0]} ${s[1]}점`).join(', ')}">${seg.map((s) => `<i style="width:${s[1]}%;background:${s[2]}"></i>`).join('')}</div>
    <div class="legend">${seg.map((s) => `<b style="background:${s[2]}"></b>${s[0]} ${s[1]}`).join('')}</div>`;
}
function viewStory() {
  const me = st.me, rf = me.reflection, t = st.team, sd = t.story, fb = draft.fb, sg = draft.story;
  const sent = !!me.feedback;
  const chips = (key, list) => `<div class="chips" role="group" aria-label="${key}">${list.map((x) => `<button type="button" data-chip="${key}" data-val="${esc(x)}" aria-pressed="${sg[key] === x}">${esc(x)}</button>`).join('')}</div>`;
  $app.innerHTML = `${banner()}${stepper('story')}${hero('team.jpg', '지도를 함께 보며 이야기하는 탐험대', '오늘 우리 팀의 모험을 이야기로 만들어요')}
    <span class="chip">${PHASE_NAME.story}</span><h1>${teamFull(me.team)} 이야기</h1>
    <p class="sub">점수보다 중요한 건 <b>어떻게 이야기했는가</b>예요. 내 의견이 얼마나 담겼는지 살펴보고, 우리 팀의 이야기를 완성해 봐요.</p>

    <h2>① 내 의견은 얼마나 담겼을까? 🧭</h2>
    ${rf ? `<div class="card sky"><div class="gauge"><span class="gp">${rf.percent}%</span><span>내 순위가 팀 순위에 담긴 정도</span></div>
      <div class="gbar"><i style="width:${rf.percent}%"></i></div>
      <p>내가 1위로 꼽은 물건 <b>${esc(itemMap[rf.mine1.id].name)}</b> → 팀 순위는 <b>${rf.mine1.team}위</b>가 됐어요.</p>
      ${rf.matched.length ? `<p>👍 잘 반영된 내 선택: ${rf.matched.map((r) => `<b>${esc(itemMap[r.id].name)}</b>(내 ${r.mine}위→팀 ${r.team}위)`).join(', ')}</p>` : ''}
      ${rf.missed.length ? `<p>🤔 아쉽게 달라진 선택: ${rf.missed.map((r) => `<b>${esc(itemMap[r.id].name)}</b>(내 ${r.mine}위→팀 ${r.team}위)`).join(', ')}<br><span class="hint" style="color:#fff">이유를 팀에 말해 봤나요? 팀이 그 이유를 들어 봤나요?</span></p>` : ''}</div>`
      : '<div class="card"><span class="hint">개인 순위 또는 팀 순위가 제출되지 않아서 반영도를 계산할 수 없어요. 그래도 아래 설문과 이야기는 함께할 수 있어요.</span></div>'}

    <h2>② 탐험대 셀프 체크 🎒</h2>
    ${FB_QS.map((q) => `<div class="card q"><div class="qq"><span aria-hidden="true">${q[1]}</span> ${esc(q[2])}</div>
      <div class="scale" role="radiogroup" aria-label="${esc(q[2])}">${q[3].map((em, i) => `<button type="button" role="radio" data-q="${q[0]}" data-v="${i + 1}" aria-checked="${fb[q[0]] === i + 1}" aria-label="${i + 1}점 ${em}"><span class="em" aria-hidden="true">${em}</span>${i + 1}</button>`).join('')}</div>
      <div class="ends"><span>${esc(q[4])}</span><span>${esc(q[5])}</span></div></div>`).join('')}
    <div class="card q"><div class="qq"><span aria-hidden="true">🌤️</span> 우리 팀 대화 분위기는 어떤 날씨였나요?</div>
      <div class="weather" role="radiogroup" aria-label="대화 분위기 날씨">${WEATHER.map((w) => `<button type="button" role="radio" data-w="${w[0]}" aria-checked="${fb.weather === w[0]}"><span class="em" aria-hidden="true">${w[1]}</span>${w[2]}</button>`).join('')}</div></div>
    <div class="card q"><label for="one" class="qq" style="display:block;margin:0 0 6px"><span aria-hidden="true">💬</span> 오늘 우리 팀을 살린 한마디 <span class="hint">(선택, 이름 없이 팀에 공유돼요)</span></label>
      <input id="one" type="text" maxlength="80" value="${esc(fb.oneLine)}" placeholder="예: “그 물건은 왜 1위예요?”"></div>
    <div class="card q"><div class="qq"><span aria-hidden="true">🎯</span> 내일 일터에서 해볼 한 가지 <span class="hint">(최대 2개)</span></div>
      <div class="chips" role="group" aria-label="내일 해볼 한 가지">${TOMORROW.map((x) => `<button type="button" data-t="${x[0]}" aria-pressed="${fb.tomorrow.includes(x[0])}">${esc(x[1])}</button>`).join('')}</div></div>
    <button class="btn" id="fbsend">${sent ? '설문 다시 제출하기' : '🎒 설문 제출하기'}</button>
    ${sent && rf ? (() => { const [em, txt] = feltVsActual(me.feedback.answers.q3, rf.percent); return `<div class="card terra"><b>${em} 느낌 vs 실제</b><br>내가 느낀 반영도 ${me.feedback.answers.q3}점 · 실제 ${rf.percent}%<br>${esc(txt)}</div>`; })() : ''}

    <h2>③ 우리 팀 이야기 만들기 📖</h2>
    <div class="card"><p class="hint" style="margin-top:0">팀원과 이야기하며 함께 골라요. (팀원 누구나 저장할 수 있고, 마지막 저장이 반영돼요)</p>
      <div class="qq">우리 팀의 위기는…</div>${chips('crisis', STORY_CHIPS.crisis)}
      <div class="qq" style="margin-top:10px">반전의 계기는…</div>${chips('twist', STORY_CHIPS.twist)}
      <div class="qq" style="margin-top:10px">그래서 결말은…</div>${chips('ending', STORY_CHIPS.ending)}
      <label for="free">우리 팀 이야기 한 줄 (선택)</label><input id="free" type="text" maxlength="100" value="${esc(sg.free)}" placeholder="예: 막내의 질문 덕분에 거울이 1위가 됐다!">
      <button class="btn alt" id="stsave">이야기 저장하기</button></div>

    <h2>④ 우리 팀 이야기 카드 🏕️</h2>
    ${storyCard(sd)}
    <div class="card"><b>발표 준비 질문</b><ol class="qlist"><li>우리 팀의 가장 뜨거웠던 순간은 언제였나요?</li><li>내 의견이 팀에 닿았던(또는 못 닿았던) 순간은?</li><li>내일 우리 일터에서 가져갈 한 가지는?</li></ol></div>`;
  const rerender = viewStory;
  $app.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { fb[b.dataset.q] = Number(b.dataset.v); rerender(); }));
  $app.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { fb.weather = b.dataset.w; rerender(); }));
  $app.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.t; fb.tomorrow = fb.tomorrow.includes(k) ? fb.tomorrow.filter((x) => x !== k) : [...fb.tomorrow, k].slice(-2); rerender();
  }));
  $app.querySelectorAll('[data-chip]').forEach((b) => b.addEventListener('click', () => { sg[b.dataset.chip] = sg[b.dataset.chip] === b.dataset.val ? '' : b.dataset.val; rerender(); }));
  $app.querySelector('#one').addEventListener('input', (e) => { fb.oneLine = e.target.value; });
  $app.querySelector('#free').addEventListener('input', (e) => { sg.free = e.target.value; });
  $app.querySelector('#fbsend').addEventListener('click', async () => {
    try {
      if (!FB_QS.every((q) => fb[q[0]]) || !fb.weather) throw new Error('모든 질문(5개)에 답해 주세요');
      await api('/api/feedback', { id: myId, answers: Object.fromEntries(FB_QS.map((q) => [q[0], fb[q[0]]])), weather: fb.weather, oneLine: fb.oneLine, tomorrow: fb.tomorrow });
      msg = null; confetti(); await refresh(true);
    } catch (e) { msg = { type: 'err', text: e.message }; viewStory(); window.scrollTo(0, 0); }
  });
  $app.querySelector('#stsave').addEventListener('click', async () => {
    try { await api('/api/story', { id: myId, crisis: sg.crisis, twist: sg.twist, ending: sg.ending, free: sg.free }); msg = null; confetti(); await refresh(true); }
    catch (e) { msg = { type: 'err', text: e.message }; viewStory(); window.scrollTo(0, 0); }
  });
}

function tier(total) {
  if (total >= 85) return ['🚁', '전원 생존! 구조 헬기가 도착했어요'];
  if (total >= 65) return ['🏕️', '다 함께 살아남았어요'];
  if (total >= 40) return ['🌵', '아슬아슬하게 버텼어요'];
  return ['🔦', '신호가 약했어요. 이야기를 더 나눠 볼까요?'];
}
function podium(teams) {
  if (teams.length < 2) return '';
  const order = [1, 0, 2].filter((i) => teams[i]);
  const medal = ['🥇', '🥈', '🥉'];
  return `<div class="podium" role="list" aria-label="시상대">${order.map((i) => `<div class="pod p${i + 1}" role="listitem"><div class="mdl" aria-hidden="true">${medal[i]}</div><div class="pn">${teamTag(teams[i].team)}</div><div class="ps">${teams[i].result.total}점</div><div class="blk">${i + 1}</div></div>`).join('')}</div>`;
}
function viewResult() {
  if (!results) { $app.innerHTML = `${banner()}${stepper('result')}${waiting('결과를 불러오는 중…')}`; return; }
  const mine = st?.me?.team;
  const top = results.teams[0];
  $app.innerHTML = `${banner()}${stepper('result')}${hero('clap.jpg', '결과를 발표하고 박수치는 탐험대', '구조대 도착! 우리 팀의 생존율은?')}
    <span class="chip">${PHASE_NAME.result}</span><h1>생존 결과 발표</h1>
    <p class="sub">정확도 40 + 시너지 30 + 참여도 30 = 100점. 오차점수는 낮을수록 정답에 가까워요.</p>
    ${st?.me?.individual ? `<div class="card terra">내 개인 오차점수 <b style="font-size:24px">${st.me.individual.error}</b>점</div>` : ''}
    ${podium(results.teams)}
    ${results.teams.map((t, i) => { const [em, line] = tier(t.result.total); return `<div class="card" ${t.team === mine ? 'style="outline:3px solid var(--terra)"' : ''}>
      <div class="row"><span class="rankno">${i + 1}위</span><b style="font-size:20px">${teamTag(t.team)}</b><span style="margin-left:auto;font-size:26px;font-weight:700">${t.result.total}점</span></div>
      <div class="tier"><span aria-hidden="true">${em}</span> ${line}</div>
      ${breakdownBar(t.result)}
      <div class="hint">팀 오차 ${t.result.teamError} · 개인 평균 오차 ${t.result.avgIndividualError ?? '-'} · 팀 내 최고 개인 오차 ${t.result.bestIndividualError ?? '-'}${t.result.synergyBonus ? ' · 팀이 최고 개인보다 좋았어요! (+10)' : ''}${t.result.participationEvaluated ? '' : ' · 참여도 미평가'}</div>
      ${t.team === mine ? hero(t.result.total >= 65 ? 'rescue.jpg' : 'camp.jpg', t.result.total >= 65 ? '텐트 앞에서 거울로 구조 헬기에 신호를 보내는 탐험가' : '낙하산 그늘막 아래에서 함께 버티는 탐험대', t.result.total >= 65 ? '거울 신호가 구조 헬기에 닿았어요!' : '함께라서 끝까지 버텼어요') : ''}</div>`; }).join('') || '<p class="hint">제출된 팀 결과가 아직 없어요.</p>'}
    ${results.pending?.length ? `<div class="card"><b>팀 순위 미제출</b><div class="pills">${results.pending.map((n) => `<span>${teamTag(n)}</span>`).join('')}</div></div>` : ''}
    <h2>생존 전문가의 정답</h2>
    <div class="card"><table class="ans"><thead><tr><th class="num">순위</th><th>물건</th><th>이유</th></tr></thead><tbody>${results.answer.map((a) => `<tr><td class="num"><b>${a.rank}</b></td><td><img class="pic sm" src="/img/item-${esc(a.id)}.jpg" alt="" width="40" height="27" loading="lazy">${esc(a.name)}</td><td>${esc(a.why)}</td></tr>`).join('')}</tbody></table></div>
    <div class="card sky"><b>오늘 게임의 비밀</b><br>함께 이야기해서 정한 답이 혼자 정한 답보다 높았나요? 의견이 가장 부딪힌 물건은 무엇이었나요?</div>
    <div class="card"><b>📖 다음은 ‘우리 팀 이야기’ 시간</b><br>진행자가 4단계로 넘기면 내 의견이 얼마나 담겼는지 확인하고 셀프 체크를 해요.</div>`;
  if (top && !resultConfetti) { resultConfetti = true; confetti(); }
}

// ---------- 진행자 ----------
function viewAdminLogin() {
  $who.textContent = '진행자';
  $app.innerHTML = `${banner()}<h1>진행자 입장</h1><p class="sub">서버를 켤 때 표시된 PIN을 입력하세요.</p>
    <label for="pin">PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="off">
    <button class="btn" id="go">입장</button><a class="btn ghost" href="#" style="text-align:center;text-decoration:none">참가자 화면으로</a>`;
  $app.querySelector('#go').addEventListener('click', async () => {
    adminPin = $app.querySelector('#pin').value; msg = null;
    try { await adminCall({ action: 'overview' }); } catch (e) { adminPin = null; msg = { type: 'err', text: e.message }; viewAdminLogin(); }
  });
}
async function adminCall(body) { admin = await api('/api/admin', { pin: adminPin, ...body }); viewAdmin(); }
function qrSvg(text, label) {
  try {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }).replace('<svg', `<svg role="img" aria-label="${esc(label)}"`);
  } catch { return '<p class="hint">QR 코드를 만들 수 없어요. 주소를 확인해 주세요.</p>'; }
}
const joinBase = () => (qrBase || location.origin).replace(/\/+$/, '');
function viewAdmin() {
  $who.textContent = '진행자';
  names = {}; admin.teams.forEach((t) => { if (t.name) names[t.team] = t.name; });
  const ph = admin.phase, base = joinBase(), cfg = admin.config;
  if (printSheet) {
    $app.innerHTML = `<div class="noprint"><button class="btn small" id="back">← 진행자 화면</button><button class="btn small alt" id="print">인쇄하기</button><div class="hint">테이블마다 한 장씩 올려 두면, 휴대폰으로 찍으면 그 팀이 미리 선택돼요.</div></div>
      <div class="sheet">${admin.teams.map((t) => `<div class="qcard"><div class="qt">${TEAMS[t.team - 1][1]} ${t.team}팀 · ${esc(teamName(t.team))}</div>${qrSvg(base + '/?team=' + t.team, `${t.team}팀 입장 QR 코드`)}<div class="qs">카메라로 찍어서 입장하세요</div></div>`).join('')}</div>`;
    $app.querySelector('#back').addEventListener('click', () => { printSheet = false; viewAdmin(); });
    $app.querySelector('#print').addEventListener('click', () => window.print());
    return;
  }
  if (qrFull) {
    $app.innerHTML = `<div class="bigqr" id="bigqr" role="button" tabindex="0" aria-label="닫기">${qrSvg(base + '/', '입장 QR 코드')}<div class="bigurl">${esc(base)}</div><div class="hint">화면을 누르면 닫혀요</div></div>`;
    const close = () => { qrFull = false; viewAdmin(); };
    $app.querySelector('#bigqr').addEventListener('click', close);
    $app.querySelector('#bigqr').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') close(); });
    return;
  }
  const lan = (admin.lanUrls || []).filter((u) => u !== base);
  $app.innerHTML = `${banner()}<h1>진행자 화면</h1>
    <div class="card"><b>현재 단계</b>
      ${['individual', 'team', 'result', 'story'].map((p) => `<button class="btn small ${p === ph ? '' : 'ghost'}" data-phase="${p}" ${p === ph ? 'aria-current="true"' : ''}>${PHASE_NAME[p]}</button>`).join('')}
      <div class="hint">단계를 바꾸면 참가자 화면이 3초 안에 따라서 바뀝니다. ‘결과 확인’은 팀 제출·참여도 입력을 마친 뒤 눌러 주세요.</div></div>
    <h2>접속 QR 코드</h2>
    <div class="card"><div class="qrbox">${qrSvg(base + '/', '입장 QR 코드')}</div>
      <label for="qrurl" style="margin-top:8px">휴대폰이 접속할 주소</label><input id="qrurl" type="text" inputmode="url" value="${esc(base)}">
      ${lan.length ? `<div class="hint">같은 와이파이 주소로 바꾸기: ${lan.map((u) => `<button class="btn small ghost" data-url="${esc(u)}">${esc(u)}</button>`).join('')}</div>` : ''}
      <div class="hint">인터넷에 올린 주소가 아니라 localhost로 열었다면, 위 칸을 이 컴퓨터의 와이파이 주소로 바꿔야 휴대폰에서 열려요.</div>
      <button class="btn alt" id="qrbig">QR 크게 보기 (화면 공유용)</button><button class="btn ghost" id="qrprint">팀별 QR 인쇄</button></div>
    <h2>팀 구성</h2>
    <div class="card"><div class="row"><div style="flex:1"><label for="tc" style="margin-top:0">팀 수</label><select id="tc">${[...Array(10)].map((_, i) => `<option value="${i + 1}" ${cfg.teamCount === i + 1 ? 'selected' : ''}>${i + 1}팀</option>`).join('')}</select></div>
      <div style="flex:1"><label for="ts" style="margin-top:0">팀당 최대 인원</label><select id="ts">${[...Array(20)].map((_, i) => `<option value="${i + 1}" ${cfg.teamSize === i + 1 ? 'selected' : ''}>${i + 1}명</option>`).join('')}</select></div></div>
      <button class="btn small" id="cfgsave">구성 저장</button>
      <h2 style="font-size:17px">팀 이름</h2>
      ${admin.teams.filter((t) => t.team <= cfg.teamCount).map((t) => `<div class="row" style="margin:6px 0"><span style="flex:0 0 64px"><b>${TEAMS[t.team - 1][1]} ${t.team}팀</b></span><input type="text" maxlength="12" data-tname="${t.team}" value="${esc(t.name)}" placeholder="${esc(TEAMS[t.team - 1][0])}" style="flex:1" aria-label="${t.team}팀 이름"></div>`).join('')}
      <div class="hint">팀원이 직접 정해도 되고, 여기서 바꿀 수도 있어요. 비워 두면 기본 이름(사막 동물)이 쓰여요.</div></div>
    <h2>팀 현황 (${admin.members.length}명 입장)</h2>
    <div class="card"><table><thead><tr><th>팀</th><th class="num">개인</th><th>팀 순위</th><th>발언 인원</th><th>소수 의견</th><th class="num">설문</th></tr></thead><tbody>
    ${admin.teams.map((t) => `<tr><td><b>${esc(teamTag(t.team))}</b><div class="hint">${t.memberCount}/${cfg.teamSize}명</div></td><td class="num">${t.individualSubmitted}/${t.memberCount}</td><td>${t.teamSubmitted ? '✔' : '–'}</td>
      <td><select data-spoken="${t.team}" aria-label="${t.team}팀 발언 인원"><option value="" ${t.spokenCount === null ? 'selected' : ''}>미입력</option>${[...Array(t.memberCount + 1)].map((_, n) => `<option value="${n}" ${t.spokenCount === n ? 'selected' : ''}>${n}/${t.memberCount}명</option>`).join('')}</select></td>
      <td><label style="margin:0;font-weight:400"><input type="checkbox" data-min="${t.team}" ${t.minorityAdopted ? 'checked' : ''}> 채택</label>${t.minorityNote ? `<div class="hint">${esc(t.minorityNote)}</div>` : ''}</td><td class="num">${t.feedbackCount}/${t.memberCount}</td></tr>`).join('')}
    </tbody></table></div>
    ${admin.phase === 'story' || admin.phase === 'result' ? `<h2>팀 이야기 카드 (발표용)</h2>${admin.stories.map((d) => storyCard(d)).join('') || '<div class="card hint">아직 입장한 팀이 없어요.</div>'}` : ''}
    <h2>참가자</h2><div class="card pills">${admin.members.map((m) => `<span class="${m.submitted ? 'done' : ''}">${esc(teamTag(m.team))} ${esc(m.name)}</span>`).join('') || '<span class="hint">없음</span>'}</div>
    <div class="hint">초록색 = 개인 순위 제출 완료</div>
    <button class="btn alt" id="refresh">새로고침</button><button class="btn ghost" id="reset">새 게임 시작(참가자·순위 지우기, 팀 구성은 유지)</button>
    <a class="btn ghost" href="#" style="text-align:center;text-decoration:none">참가자 화면으로</a>`;
  const q = (sel) => $app.querySelector(sel);
  $app.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => adminCall({ action: 'setPhase', phase: b.dataset.phase }).catch(adminErr)));
  $app.querySelectorAll('[data-spoken]').forEach((x) => x.addEventListener('change', () => adminCall({ action: 'setSpoken', team: Number(x.dataset.spoken), spokenCount: x.value === '' ? null : Number(x.value) }).catch(adminErr)));
  $app.querySelectorAll('[data-min]').forEach((c) => c.addEventListener('change', () => adminCall({ action: 'setMinority', team: Number(c.dataset.min), value: c.checked }).catch(adminErr)));
  $app.querySelectorAll('[data-tname]').forEach((i) => i.addEventListener('change', () => adminCall({ action: 'setTeamName', team: Number(i.dataset.tname), name: i.value }).catch(adminErr)));
  $app.querySelectorAll('[data-url]').forEach((bt) => bt.addEventListener('click', () => { qrBase = bt.dataset.url; store.set('ds_qr_url', qrBase); viewAdmin(); }));
  q('#qrurl').addEventListener('change', (e) => { const v = e.target.value.trim(); qrBase = /^https?:\/\//.test(v) ? v : (v ? 'http://' + v : ''); store.set('ds_qr_url', qrBase); viewAdmin(); });
  q('#qrbig').addEventListener('click', () => { qrFull = true; viewAdmin(); });
  q('#qrprint').addEventListener('click', () => { printSheet = true; viewAdmin(); });
  q('#cfgsave').addEventListener('click', () => adminCall({ action: 'setConfig', teamCount: Number(q('#tc').value), teamSize: Number(q('#ts').value) }).then(() => { msg = { type: 'ok', text: '팀 구성을 저장했어요' }; viewAdmin(); msg = null; }).catch(adminErr));
  q('#refresh').addEventListener('click', () => adminCall({ action: 'overview' }).catch(adminErr));
  q('#reset').addEventListener('click', () => { if (confirm('모든 참가자와 순위를 지우고 새로 시작할까요? (팀 수·인원 설정은 유지돼요)')) adminCall({ action: 'reset' }).catch(adminErr); });
}
function adminErr(e) { msg = { type: 'err', text: e.message }; viewAdmin(); }

// ---------- 흐름 ----------
function render() {
  if (isAdmin()) { adminPin && admin ? viewAdmin() : viewAdminLogin(); return; }
  if (!myId || !st?.me) return viewJoin();
  $who.textContent = `${teamFull(st.me.team)} · ${st.me.name}`;
  if (!draft || draft.phase !== st.phase) {
    lastMoved = -1;
    draft = { phase: st.phase, reason: st.me.individual?.reason || '', minorityAdopted: st.team?.minorityAdopted || false, minorityNote: st.team?.minorityNote || '',
      fb: { q1: 0, q2: 0, q3: 0, q4: 0, weather: '', oneLine: '', tomorrow: [], ...(st.me.feedback ? { ...st.me.feedback.answers, weather: st.me.feedback.weather, oneLine: st.me.feedback.oneLine, tomorrow: [...st.me.feedback.tomorrow] } : {}) },
      story: { crisis: '', twist: '', ending: '', free: '', ...(st.team?.story?.story || {}) },
      ranking: st.phase === 'individual' ? [...(st.me.individual?.ranking || items.map((i) => i.id))] : [...(st.team?.consensus || st.team?.avgOrder || items.map((i) => i.id))] };
  }
  if (st.phase === 'individual') viewIndividual();
  else if (st.phase === 'team') viewTeam();
  else if (st.phase === 'story') viewStory();
  else viewResult();
}

async function refresh(force) {
  if (isAdmin()) return;
  try {
    if (!items.length) { items = (await api('/api/items')).items; itemMap = Object.fromEntries(items.map((i) => [i.id, i])); }
    st = await api('/api/state?id=' + encodeURIComponent(myId || ''));
    names = st.teamNames || {};
    if (myId && !st.me) { store.del('ds_id'); myId = null; draft = null; }
    if (!st.me) { lobby = await api('/api/lobby'); names = lobby.teamNames || names; }
    if (st.phase === 'result' && st.me) { try { results = await api('/api/results'); } catch { /* 아직 비공개 */ } }
    if (st.phase !== 'result') results = null;
    const next = JSON.stringify([st.phase, st.me?.id, st.me?.team, names, lobby?.teams, st.team?.members, !!st.team?.consensus, st.team?.contested, st.team?.story, !!st.me?.feedback, !!results && results.teams.map((t) => t.result.total)]);
    if (force || next !== sig) { sig = next; render(); }
  } catch (e) {
    if (!st) { $app.innerHTML = `<div class="err" role="alert">서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.</div>`; }
  }
}

window.addEventListener('hashchange', () => { msg = null; sig = ''; if (isAdmin()) render(); else refresh(true); });
if (isAdmin()) render(); else refresh(true);
setInterval(() => { if (!document.hidden) refresh(false); }, 3000);
setInterval(async () => {
  // 진행자 화면은 입력 중이 아닐 때만 5초마다 자동 갱신
  if (!isAdmin() || !adminPin || !admin || document.hidden || qrFull || printSheet || $app.contains(document.activeElement) && document.activeElement !== document.body) return;
  try { admin = await api('/api/admin', { pin: adminPin, action: 'overview' }); viewAdmin(); } catch { /* 다음 주기에 재시도 */ }
}, 5000);
