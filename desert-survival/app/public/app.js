'use strict';
const $app = document.getElementById('app');
const $who = document.getElementById('who');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
};
const PHASE_NAME = { individual: '1단계 · 혼자 정하기', team: '2단계 · 팀이 하나로', result: '3단계 · 결과 확인' };

let items = [], itemMap = {};
let myId = store.get('ds_id');
let st = null;            // 서버 상태
let draft = null;         // 입력 중인 내용 {phase, ranking, reason, minorityAdopted, minorityNote}
let msg = null;           // {type:'err'|'ok', text}
let results = null;
let sig = '';
let adminPin = null;      // 진행자 PIN(세션 동안만 메모리에 보관)
let admin = null;         // 진행자 개요
let joinTeam = null, joinName = '';

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
    <li><span class="no">${i + 1}</span><span class="em" aria-hidden="true">${itemMap[id].emoji}</span><span class="nm">${esc(itemMap[id].name)}</span>
    ${editable ? `<span class="mv"><button data-mv="${i}" data-d="-1" aria-label="${esc(itemMap[id].name)} 한 칸 위로" ${i === 0 ? 'disabled' : ''}>▲</button><button data-mv="${i}" data-d="1" aria-label="${esc(itemMap[id].name)} 한 칸 아래로" ${i === ranking.length - 1 ? 'disabled' : ''}>▼</button></span>` : ''}</li>`).join('')}</ol>`;
}
function bindRank(onChange) {
  $app.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.mv), j = i + Number(b.dataset.d), r = draft.ranking;
    if (j < 0 || j >= r.length) return;
    [r[i], r[j]] = [r[j], r[i]];
    msg = null; onChange();
  }));
}

// ---------- 화면 ----------
function viewJoin() {
  $who.textContent = '';
  $app.innerHTML = `${banner()}<h1>사막에 불시착했어요!</h1>
    <p class="sub">이름과 팀을 정하고 입장하세요. 같은 이름·같은 팀으로 다시 들어오면 이어서 할 수 있어요.</p>
    <label for="nm">이름</label><input id="nm" type="text" maxlength="20" autocomplete="off" value="${esc(joinName)}" placeholder="예: 홍길동">
    <label id="tl">팀 번호</label><div class="teams" role="group" aria-labelledby="tl">${[...Array(10)].map((_, i) => `<button type="button" data-team="${i + 1}" aria-pressed="${joinTeam === i + 1}">${i + 1}</button>`).join('')}</div>
    <button class="btn" id="go">입장하기</button>`;
  $app.querySelector('#nm').addEventListener('input', (e) => { joinName = e.target.value; });
  $app.querySelectorAll('[data-team]').forEach((b) => b.addEventListener('click', () => { joinTeam = Number(b.dataset.team); viewJoin(); }));
  $app.querySelector('#go').addEventListener('click', async () => {
    try {
      const r = await api('/api/join', { name: joinName, team: joinTeam });
      myId = r.id; store.set('ds_id', myId); msg = null; draft = null; await refresh(true);
    } catch (e) { msg = { type: 'err', text: e.message }; viewJoin(); }
  });
}

function viewIndividual() {
  const me = st.me, submitted = !!me.individual;
  $app.innerHTML = `${banner()}<span class="chip">${PHASE_NAME.individual}</span><h1>조용히 나만의 답 정하기</h1>
    <p class="sub">아직 옆 사람과 이야기하지 마세요. 살아남는 데 가장 중요한 물건부터 1위~15위 순서로 ▲▼ 버튼으로 정해 보세요.</p>
    ${rankList(draft.ranking, true)}
    <label for="why">왜 이걸 1위로 했나요? (선택)</label><input id="why" type="text" maxlength="80" value="${esc(draft.reason)}" placeholder="나만의 이유를 한 줄로">
    <button class="btn" id="sub">${submitted ? '다시 제출하기' : '내 순위 제출하기'}</button>
    ${submitted ? '<div class="ok">제출했어요! 진행자가 다음 단계로 넘길 때까지 기다려 주세요. 바꾸고 싶으면 다시 제출할 수 있어요.</div>' : ''}`;
  bindRank(viewIndividual);
  $app.querySelector('#why').addEventListener('input', (e) => { draft.reason = e.target.value; });
  $app.querySelector('#sub').addEventListener('click', async () => {
    try { await api('/api/individual', { id: myId, ranking: draft.ranking, reason: draft.reason }); msg = { type: 'ok', text: '제출했어요!' }; await refresh(true); msg = null; }
    catch (e) { msg = { type: 'err', text: e.message }; viewIndividual(); }
  });
}

function viewTeam() {
  const t = st.team, nm = (id) => esc(itemMap[id]?.name || id);
  $app.innerHTML = `${banner()}<span class="chip">${PHASE_NAME.team}</span><h1>${t.team}팀, 투표 없이 이야기로!</h1>
    <p class="sub">다수결·가위바위보는 금지! 직급·연차 말고 ‘이유’로 이야기하세요. <b>기록 담당 1명</b>만 팀 순위를 제출해 주세요.</p>
    <div class="card"><b>우리 팀</b><div class="pills">${t.members.map((m) => `<span class="${m.submitted ? 'done' : ''}">${esc(m.name)}</span>`).join('')}</div></div>
    ${t.contested?.length ? `<div class="card sky"><b>의견이 가장 갈린 물건</b><div class="pills">${t.contested.map((c) => `<span>${nm(c.id)} · ${c.min}위~${c.max}위</span>`).join('')}</div><div class="hint" style="color:#fff">여기부터 이야기해 보세요. 처음 순서는 팀원 순위의 평균이에요.</div></div>` : ''}
    ${rankList(draft.ranking, true)}
    <div class="card"><label style="margin-top:0"><input type="checkbox" id="min" ${draft.minorityAdopted ? 'checked' : ''}> 조용하거나 막내 팀원의 의견 덕분에 바뀐 순위가 있어요</label>
    <input id="note" type="text" maxlength="100" value="${esc(draft.minorityNote)}" placeholder="어떤 의견이었나요? (예: 신입이 거울을 1위로 제안)" style="margin-top:8px"></div>
    <button class="btn" id="sub">${t.consensus ? '팀 순위 다시 제출하기' : '팀 순위 제출하기'}</button>
    ${t.consensus ? '<div class="ok">팀 순위가 제출되어 있어요. 진행자가 결과를 공개할 때까지 기다려 주세요.</div>' : ''}
    <details class="card"><summary><b>내 개인 순위 보기</b></summary>${st.me.individual ? rankList(st.me.individual.ranking, false) : '<p class="hint">제출한 개인 순위가 없어요.</p>'}</details>`;
  bindRank(viewTeam);
  $app.querySelector('#min').addEventListener('change', (e) => { draft.minorityAdopted = e.target.checked; });
  $app.querySelector('#note').addEventListener('input', (e) => { draft.minorityNote = e.target.value; });
  $app.querySelector('#sub').addEventListener('click', async () => {
    try { await api('/api/team', { id: myId, ranking: draft.ranking, minorityAdopted: draft.minorityAdopted, minorityNote: draft.minorityNote }); msg = { type: 'ok', text: '팀 순위를 제출했어요!' }; await refresh(true); msg = null; }
    catch (e) { msg = { type: 'err', text: e.message }; viewTeam(); }
  });
}

function breakdownBar(r) {
  const seg = [['정확도', r.accuracy, 'var(--dk)'], ['시너지', r.synergy, 'var(--sky)'], ['발언', r.speak, 'var(--gold)'], ['소수 의견', r.minority, 'var(--green)']];
  return `<div class="bar" role="img" aria-label="${seg.map((s) => `${s[0]} ${s[1]}점`).join(', ')}">${seg.map((s) => `<i style="width:${s[1]}%;background:${s[2]}"></i>`).join('')}</div>
    <div class="legend">${seg.map((s) => `<b style="background:${s[2]}"></b>${s[0]} ${s[1]}`).join('')}</div>`;
}
function viewResult() {
  if (!results) { $app.innerHTML = `${banner()}<span class="chip">${PHASE_NAME.result}</span><h1>결과를 불러오는 중…</h1>`; return; }
  const mine = st?.me?.team;
  $app.innerHTML = `${banner()}<span class="chip">${PHASE_NAME.result}</span><h1>우리 팀의 생존율은?</h1>
    <p class="sub">정확도 40 + 시너지 30 + 참여도 30 = 100점. 오차점수는 낮을수록 정답에 가까워요.</p>
    ${st?.me?.individual ? `<div class="card terra">내 개인 오차점수 <b style="font-size:24px">${st.me.individual.error}</b>점</div>` : ''}
    ${results.teams.map((t, i) => `<div class="card" ${t.team === mine ? 'style="outline:3px solid var(--terra)"' : ''}>
      <div class="row"><span class="rankno">${i + 1}위</span><b style="font-size:20px">${t.team}팀</b><span style="margin-left:auto;font-size:26px;font-weight:700">${t.result.total}점</span></div>
      ${breakdownBar(t.result)}
      <div class="hint">팀 오차 ${t.result.teamError} · 개인 평균 오차 ${t.result.avgIndividualError ?? '-'} · 팀 내 최고 개인 오차 ${t.result.bestIndividualError ?? '-'}${t.result.synergyBonus ? ' · 팀이 최고 개인보다 좋았어요! (+10)' : ''}${t.result.participationEvaluated ? '' : ' · 참여도 미평가'}</div></div>`).join('') || '<p class="hint">제출된 팀 결과가 아직 없어요.</p>'}
    ${results.pending?.length ? `<div class="card"><b>팀 순위 미제출</b><div class="pills">${results.pending.map((n) => `<span>${n}팀</span>`).join('')}</div></div>` : ''}
    <h2>생존 전문가의 정답</h2>
    <div class="card"><table class="ans"><thead><tr><th class="num">순위</th><th>물건</th><th>이유</th></tr></thead><tbody>${results.answer.map((a) => `<tr><td class="num"><b>${a.rank}</b></td><td>${esc(a.name)}</td><td>${esc(a.why)}</td></tr>`).join('')}</tbody></table></div>
    <div class="card sky"><b>오늘 게임의 비밀</b><br>함께 이야기해서 정한 답이 혼자 정한 답보다 높았나요? 의견이 가장 부딪힌 물건은 무엇이었나요?</div>`;
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
function viewAdmin() {
  $who.textContent = '진행자';
  const ph = admin.phase, byTeam = (n) => admin.teams.find((t) => t.team === n);
  $app.innerHTML = `${banner()}<h1>진행자 화면</h1>
    <div class="card"><b>현재 단계</b>
      ${['individual', 'team', 'result'].map((p) => `<button class="btn small ${p === ph ? '' : 'ghost'}" data-phase="${p}" ${p === ph ? 'aria-current="true"' : ''}>${PHASE_NAME[p]}</button>`).join('')}
      <div class="hint">단계를 바꾸면 참가자 화면이 3초 안에 따라서 바뀝니다. ‘결과 확인’은 팀 제출·참여도 입력을 마친 뒤 눌러 주세요.</div></div>
    <h2>팀 현황 (${admin.members.length}명 입장)</h2>
    <div class="card"><table><thead><tr><th>팀</th><th class="num">개인</th><th>팀 순위</th><th>발언 인원</th><th>소수 의견</th></tr></thead><tbody>
    ${admin.teams.map((t) => `<tr><td><b>${t.team}</b></td><td class="num">${t.individualSubmitted}/${t.memberCount}</td><td>${t.teamSubmitted ? '✔' : '–'}</td>
      <td><select data-spoken="${t.team}" aria-label="${t.team}팀 발언 인원"><option value="" ${t.spokenCount === null ? 'selected' : ''}>미입력</option>${[...Array(t.memberCount + 1)].map((_, n) => `<option value="${n}" ${t.spokenCount === n ? 'selected' : ''}>${n}/${t.memberCount}명</option>`).join('')}</select></td>
      <td><label style="margin:0;font-weight:400"><input type="checkbox" data-min="${t.team}" ${t.minorityAdopted ? 'checked' : ''}> 채택</label>${t.minorityNote ? `<div class="hint">${esc(t.minorityNote)}</div>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="hint">아직 입장한 참가자가 없어요.</td></tr>'}
    </tbody></table></div>
    <h2>참가자</h2><div class="card pills">${admin.members.map((m) => `<span class="${m.submitted ? 'done' : ''}">${m.team}팀 ${esc(m.name)}</span>`).join('') || '<span class="hint">없음</span>'}</div>
    <div class="hint">초록색 = 개인 순위 제출 완료</div>
    <button class="btn alt" id="refresh">새로고침</button><button class="btn ghost" id="reset">새 게임 시작(모든 입력 지우기)</button>
    <a class="btn ghost" href="#" style="text-align:center;text-decoration:none">참가자 화면으로</a>`;
  $app.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => adminCall({ action: 'setPhase', phase: b.dataset.phase }).catch(adminErr)));
  $app.querySelectorAll('[data-spoken]').forEach((s) => s.addEventListener('change', () => adminCall({ action: 'setSpoken', team: Number(s.dataset.spoken), spokenCount: s.value === '' ? null : Number(s.value) }).catch(adminErr)));
  $app.querySelectorAll('[data-min]').forEach((c) => c.addEventListener('change', () => adminCall({ action: 'setMinority', team: Number(c.dataset.min), value: c.checked }).catch(adminErr)));
  $app.querySelector('#refresh').addEventListener('click', () => adminCall({ action: 'overview' }).catch(adminErr));
  $app.querySelector('#reset').addEventListener('click', () => { if (confirm('모든 참가자와 순위를 지우고 새로 시작할까요?')) adminCall({ action: 'reset' }).catch(adminErr); });
}
function adminErr(e) { msg = { type: 'err', text: e.message }; viewAdmin(); }

// ---------- 흐름 ----------
function render() {
  if (isAdmin()) { adminPin && admin ? viewAdmin() : viewAdminLogin(); return; }
  if (!myId || !st?.me) return viewJoin();
  $who.textContent = `${st.me.team}팀 · ${st.me.name}`;
  if (!draft || draft.phase !== st.phase) {
    draft = { phase: st.phase, reason: st.me.individual?.reason || '', minorityAdopted: st.team?.minorityAdopted || false, minorityNote: st.team?.minorityNote || '',
      ranking: st.phase === 'individual' ? [...(st.me.individual?.ranking || items.map((i) => i.id))] : [...(st.team?.consensus || st.team?.avgOrder || items.map((i) => i.id))] };
  }
  if (st.phase === 'individual') viewIndividual();
  else if (st.phase === 'team') viewTeam();
  else viewResult();
}

async function refresh(force) {
  if (isAdmin()) return;
  try {
    if (!items.length) { items = (await api('/api/items')).items; itemMap = Object.fromEntries(items.map((i) => [i.id, i])); }
    st = await api('/api/state?id=' + encodeURIComponent(myId || ''));
    if (myId && !st.me) { store.del('ds_id'); myId = null; draft = null; }
    if (st.phase === 'result' && st.me) { try { results = await api('/api/results'); } catch { /* 아직 비공개 */ } }
    if (st.phase !== 'result') results = null;
    const next = JSON.stringify([st.phase, st.me?.id, st.me?.team, st.team?.members, !!st.team?.consensus, st.team?.contested, !!results && results.teams.map((t) => t.result.total)]);
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
  if (!isAdmin() || !adminPin || !admin || document.hidden || $app.contains(document.activeElement) && document.activeElement !== document.body) return;
  try { admin = await api('/api/admin', { pin: adminPin, action: 'overview' }); viewAdmin(); } catch { /* 다음 주기에 재시도 */ }
}, 5000);
