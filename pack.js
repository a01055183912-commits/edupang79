// 학습자료 파일(.md) 만들기 + Claude로 질문하기. study-data.js가 먼저 로드되어 있어야 한다.
'use strict';
const Pack=(()=>{
 const LEARN_KEY='edupang-learn-v1';
 const mdc=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
 const tbl=(head,rows)=>`| ${head.join(' | ')} |\n|${head.map(()=>'---').join('|')}|\n`+rows.map(r=>`| ${r.map(mdc).join(' | ')} |`).join('\n');
 const today=()=>new Date(Date.now()+9*36e5).toISOString().slice(0,10);

 const INSTRUCTION=`# 이 파일을 쓰는 방법 (Claude에게)

당신은 에듀팡파트너즈 수강생의 학습을 돕는 튜터입니다. 이 파일은 수강생이 공부하는 교안 내용을 정리한 학습자료입니다.

- 질문에는 **이 파일의 내용을 근거로** 답하고, 근거가 된 부분(레슨 이름, 슬라이드 번호, 판례 번호)을 함께 알려 주세요.
- 파일에 없는 내용은 「자료에 없습니다」라고 먼저 말하세요. 일반 지식으로 보충할 때는 자료의 내용과 구분해서 밝히세요.
- 판결 번호와 내용은 교안 표기를 그대로 옮긴 것이며 원문 판결을 확인하지 않았습니다. 법적 판단이 필요한 상황에는 변호사 등 전문가 상담을 권해 주세요.
- 수강생이 사업주가 되려는 사람이라는 점을 고려해 쉬운 말로 설명하고, 이해했는지 짧은 질문으로 확인해 주세요.
- 공고 목록은 확인용입니다. 접수 기한과 자격은 반드시 공고문 원문을 확인하라고 안내해 주세요.
`;

 function guideMd(){
  return `## 1. 정책사업 준비 가이드

### 지침 → 공고 → 양식
${GUIDE.flow.map(x=>'- '+x).join('\n')}

### 공고를 볼 때 확인할 것
${GUIDE.checks.map(c=>`- [ ] **${c[1]}**: ${c[2]}`).join('\n')}

### 제출 서류
${tbl(['양식','작성 포인트','준비 방법'],GUIDE.docs)}

### 신청 전에 갖춰 두면 좋은 정보
${tbl(['정보','쓰이는 곳','기록하는 곳'],GUIDE.info)}

### 사업주가 알아야 할 정보가 정책사업에 왜 필요한가
${tbl(['교안의 정보','정책사업에서 쓰이는 곳','왜 필요한가'],GUIDE.why)}
`}
 function courseMd(){
  return `## 2. 사업주 과정 지도 (교안 「나는 사업주다」 v0.6)

4개 과정이 하나의 성장 경로(총 72시간)입니다. 중급·상급 단원의 시간은 교안에서 확인하지 못한 추정값입니다.

${CATALOG.map(c=>`### ${c.name}: ${c.title}\n${tbl(['단원','제목','시간','학습구분','학습목표 / 산출물'],c.mods.map(m=>[m.id,m.t,m.h+'h'+(m.est?' (추정)':''),m.k||'',[m.goal,m.out].filter(Boolean).join(' / ')]))}\n대표 산출물: ${c.out}`).join('\n\n')}
`}
 function secMd(x){
  const o=[`#### ${x.t}${x.sl?` (슬라이드 ${x.sl})`:''}`];
  if(x.flow)o.push('흐름: '+x.flow.map(f=>f.replace('|',' — ')).join(' → '));
  if(x.pts)o.push(x.pts.map(p=>'- '+p).join('\n'));
  if(x.cal)o.push(x.cal.map(m=>`- ${m[0]}: ${m[1].map(i=>i[0]).join(' / ')||'—'}`).join('\n'));
  (x.tables||[]).forEach(t=>o.push((t.title?`**${t.title}**\n`:'')+tbl(t.head,t.rows)));
  if(x.story)o.push('사례: '+x.story);
  if(x.tip)o.push('> 핵심: '+x.tip);
  if(x.discuss)o.push('토론: '+x.discuss);
  return o.join('\n\n')}
 function unitsMd(){
  const I=COURSE.intro;
  return `## 2-2. 입문과정 교안 학습 내용 (교안 「나는 사업주다」 입문 과정 v0.6, 83장)

교안의 세율·한도·요건은 교안이 밝힌 대로 강의 연도 기준 요약입니다. 실제 신고·신청 전에는 국세청·관할 기관 안내로 확인해야 합니다.

### 과정 안내 (슬라이드 ${I.slides})
이 과정을 마치면 할 수 있는 것:
${I.goals.map((g,i)=>`${i+1}. ${g}`).join('\n')}

${I.sections.map(secMd).join('\n\n')}

${COURSE.units.map(u=>`### ${u.id} ${u.title} (${u.meta})
이 단원을 마치면:
${u.goals.map(g=>'- '+g).join('\n')}

${u.sections.map(secMd).join('\n\n')}
${u.practice?'\n#### 실습\n'+u.practice.map(p=>`- **${p.t}** (${p.time}) — 목표: ${p.goal} / 방법: ${p.steps} / 산출물: ${p.out}${p.note?' / '+p.note:''}`).join('\n'):''}

#### ${u.id} 정리
${u.summary.map((x,i)=>`${i+1}. ${x}`).join('\n')}
자가 점검: ${u.selfCheck}`).join('\n\n')}

### 입문 과정 마무리 (슬라이드 79~82)
내가 만든 네 가지: ${COURSE.wrap.made.map(m=>m[0]+' '+m[1]).join(' / ')}
다음 단계(초급 16시간): ${COURSE.wrap.next.map(n=>`${n[0]}(${n[1]}) ${n[2]}`).join(', ')}
${COURSE.wrap.note}

### 입문 과정 용어 색인
${COURSE.terms.map(t=>`- **${t[0]}**: ${t[1]}`).join('\n')}

### 입문 과정 확인 퀴즈 (정답 포함)
${COURSE.units.map(u=>`**${u.id} ${u.title}**\n`+u.quiz.map((q,i)=>`${i+1}. ${q.q}\n${q.o.map((o,k)=>`   ${'①②③④'[k]} ${o}`).join('\n')}\n   - 정답: ${'①②③④'[q.a]} — ${q.e} (${q.r})`).join('\n')).join('\n\n')}
`}
 function lessonMd(){
  return `## 3. 정부지원금 사후관리 레슨 (변호사 강의 교안, 52장)

${LESSONS.map(l=>`### ${l.title} (교안 슬라이드 ${l.slides})
${l.summary}
${l.points?'\n'+l.points.map(p=>'- '+p).join('\n'):''}
${(l.tables||[]).map(t=>`\n**${t.title||''}**\n${tbl(t.head,t.rows)}`).join('\n')}
${l.cases?'\n**관련 판례**\n'+l.cases.map(c=>`- ${c[0]}: ${c[1]}`).join('\n'):''}
${l.qa?'\n**Q&A**\n'+l.qa.map(q=>`- **${q[0]}**\n  - ${q[1]}`).join('\n'):''}

> 기억할 것: ${l.remember}`).join('\n\n')}
`}
 function toolsMd(){
  return `## 4. 통보서 성격 판별 7문항
통보서를 받은 즉시 아래 7가지를 확인합니다. 소송 종류와 피고 선택을 좌우합니다.

${NOTICE7.map(it=>`**${it.q}**\n${it.o.map(o=>`- ${o[0]} → ${o[1]}`).join('\n')}`).join('\n\n')}

## 5. 정부지원금 10계명
${TEN.map((t,i)=>`${i+1}. **${t[0]}** — ${t[1]} (${t[2]})`).join('\n')}

### 절대 하지 말 것 6가지
${SIX.map((s,i)=>`${i+1}. ${s[0]} → ${s[1]}`).join('\n')}

## 6. 판례 색인 (교안 표기 그대로)
${tbl(['사건','내용','슬라이드'],CASES)}

## 7. 용어집
${GLOSS.map(g=>`- **${g[0]}**: ${g[1]}`).join('\n')}
`}
 function quizMd(){
  return `## 8. 연습 문제 (정답 포함)
${QUIZ.map((q,i)=>`${i+1}. ${q.q}\n${q.o.map((o,k)=>`   ${'①②③④'[k]} ${o}`).join('\n')}\n   - 정답: ${'①②③④'[q.a]} — ${q.e} (${q.r})`).join('\n')}
`}
 async function noticesMd(){
  try{
   const r=await fetch('data/notices.json',{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();
   return `## 9. 수집된 정책사업 공고 (마지막 수집 ${(j.updatedAt||'').replace('T',' ').slice(0,16)})
접수 기한과 자격은 공고문 원문을 확인하세요.

${tbl(['마감','공고','기관','링크'],(j.items||[]).map(x=>[x.deadline||'미정',x.title,x.sourceName,x.url]))}
`}catch(e){return `## 9. 수집된 정책사업 공고\n(이 파일을 만들 때 공고 목록을 불러오지 못했습니다.)\n`}
 }
 function meMd(){
  try{const s=JSON.parse(localStorage.getItem(LEARN_KEY)||'null'),m=s&&s.me;if(!m)return'';
   const rows=[['사업 형태',m.form],['사업자등록',m.hasBiz],['개업 연월일',m.openDate],['업종',m.bizType],['연령(만)',m.age],['소재지',m.region],['자부담 가용 금액(원)',m.selfFund],['기존 수혜 이력',m.prior]].filter(r=>r[1]!==''&&r[1]!=null&&r[1]!==0);
   if(!rows.length)return'';
   return `## 10. 내 정보 (수강생이 직접 입력한 내용)\n${tbl(['항목','내용'],rows)}\n`}catch(e){return''}
 }
 async function build(opts={}){
  const parts=[`# 정부지원금·정책사업 학습자료 (에듀팡파트너즈 수강생용)\n\n생성일 ${today()} · 출처: 강의교안 「나는 사업주다」 v0.6, 변호사 강의 「정부지원금, 받는 것보다 ‘지키는 것’이 더 어렵습니다」\n`,INSTRUCTION,guideMd(),courseMd(),unitsMd(),lessonMd(),toolsMd(),quizMd(),await noticesMd()];
  if(opts.includeMe){const m=meMd();if(m)parts.push(m)}
  return parts.join('\n');
 }
 function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(e){return false}}

 const PROMPTS=[
  ['처음 시작','첨부한 학습자료만 근거로 답해 줘. 먼저 이 자료가 어떤 내용인지 5줄로 요약하고, 내가 어디서부터 공부하면 좋은지 알려 줘.'],
  ['퀴즈로 공부','첨부한 학습자료에서 핵심 개념 5가지를 골라 퀴즈를 한 문제씩 내 줘. 내가 답하면 맞는지 설명하고 근거 슬라이드도 알려 줘.'],
  ['공고 읽기 연습','첨부한 자료의 「공고를 볼 때 확인할 것」 기준으로, 내가 붙여 넣는 공고문에서 지원 대상·제외 대상·유의사항을 찾아 정리해 줘.'],
  ['통보서 받았을 때','첨부한 자료의 「통보서 성격 판별 7문항」대로, 내 통보서에 대해 한 문항씩 질문해 줘. 마지막에 어떤 점을 더 확인해야 하는지 정리해 줘.'],
  ['10계명 외우기','첨부한 자료의 정부지원금 10계명을 하나씩 가려서 내가 이유를 맞히게 질문해 줘.']];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function claudeUrl(p){return 'https://claude.ai/new?q='+encodeURIComponent(p)}
 function cardHtml(opts={}){
  return `<div class="card"><h2>학습자료를 내려받아 Claude에게 질문하기</h2>
 <p style="margin:6px 0">이 도구의 모든 학습 내용(정책사업 준비 가이드, 사업주 과정 지도, 사후관리 레슨 11개, 판례·용어, 연습 문제, 현재 공고 목록)을 <b>파일 하나</b>로 만들어 드립니다. 이 파일을 Claude에 올리면 내용을 근거로 설명해 주고, 퀴즈를 내 주고, 내 상황에 맞춰 질문에 답해 줍니다.</p>
 <ol><li><b>학습자료 내려받기</b>를 누릅니다. (파일 이름: <code>edupang_study_pack.md</code>)</li>
 <li><b>Claude 열기</b>를 눌러 Claude(claude.ai)의 새 대화를 엽니다. 로그인이 필요합니다.</li>
 <li>대화창의 <b>＋(첨부)</b> 버튼이나 끌어다 놓기로 내려받은 파일을 올립니다.</li>
 <li>아래 질문 예시를 복사해 붙여 넣거나 궁금한 것을 직접 묻습니다.</li></ol>
 ${opts.withMe?`<label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><input type="checkbox" id="packMe"><span>「내 정보」 탭에 입력한 내용도 파일에 넣기 <span class="hint">(개인 정보가 들어갑니다. 파일을 올리기 전에 내용을 확인하세요.)</span></span></label>`:''}
 <div class="row" style="margin-top:8px"><button class="btn pri" data-pack="download">학습자료 내려받기 (.md)</button>
 <a class="btn" href="${claudeUrl(PROMPTS[0][1])}" target="_blank" rel="noopener noreferrer">Claude 열기</a></div>
 <p class="hint" style="margin:8px 0 0">Claude 열기는 질문 예시 「처음 시작」이 미리 입력된 새 대화를 엽니다. 입력되어 있지 않으면 아래 예시를 복사해 붙여 넣으세요. 파일은 자동으로 첨부되지 않으니 직접 올려 주세요.</p></div>
 <div class="card"><h2>질문 예시</h2><p class="hint">눌러서 복사한 뒤 Claude에 붙여 넣으세요.</p>
 ${PROMPTS.map((p,i)=>`<div class="fc"><b>${esc(p[0])}</b><p style="margin:4px 0">${esc(p[1])}</p><div class="row"><button class="btn sm" data-pack="copy:${i}">복사</button><a class="btn sm" href="${claudeUrl(p[1])}" target="_blank" rel="noopener noreferrer">이 질문으로 Claude 열기</a></div></div>`).join('')}
 <p class="hint" style="margin-bottom:0">Claude의 답은 올려 준 자료를 근거로 하더라도 틀릴 수 있습니다. 중요한 내용은 교안과 공고문 원문으로 다시 확인하세요.</p></div>`}

 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-pack]');if(!b)return;const [a,arg]=b.dataset.pack.split(':');
  if(a==='download'){const me=document.getElementById('packMe');const t=await build({includeMe:!!(me&&me.checked)});download('edupang_study_pack.md',t);try{localStorage.setItem('edupang-pack-dl','1')}catch(e){}Pack.onMsg&&Pack.onMsg(`파일을 만들었습니다 (${Math.round(t.length/1024)}KB). Claude에 올려 주세요.`)}
  else if(a==='copy'){const ok=await copy(PROMPTS[+arg][1]);Pack.onMsg&&Pack.onMsg(ok?'복사했습니다':'복사가 막혀 있습니다. 직접 선택해 복사하세요.')}
 });
 return{build,cardHtml,PROMPTS,onMsg:null};
})();
