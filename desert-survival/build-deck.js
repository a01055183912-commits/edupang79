const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const gi = require("react-icons/gi");
const fa = require("react-icons/fa");
const SKILL = "/root/.claude/skills/synced/cadccaee-ad0e-4483-8eeb-a374c73b78da_269c8b82-06fc-404a-8cbc-cceeb1f34df0/pptx";
const { applyTheme } = require(SKILL + "/scripts/apply_theme.js");

const THEME = {
  name: "Desert Survival",
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  colors: {
    dk1: "2B2118", lt1: "FFFFFF", dk2: "5A3E24", lt2: "F6EBD6",
    accent1: "C8553D", accent2: "E0A43B", accent3: "2E86AB",
    accent4: "4C8C4A", accent5: "8A6A4B", accent6: "D9C5A0",
    hlink: "2E86AB", folHlink: "8A6A4B",
  },
};
const HX = { dk1: "2B2118", lt1: "FFFFFF", dk2: "5A3E24", lt2: "F6EBD6", a1: "C8553D", a2: "E0A43B", a3: "2E86AB", a4: "4C8C4A", a5: "8A6A4B", a6: "D9C5A0" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "사막 생존 게임 - 중구도시관리공단";
pres.author = "중구도시관리공단 워크숍";
const C = pres.SchemeColor;
const W = 13.33;

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ---------- layouts ----------
const FOOT = "중구도시관리공단  ·  3차시 함께 정하기";
pres.defineSlideMaster({
  title: "TITLE", background: { color: HX.dk1 },
  objects: [],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: HX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontFace: "Malgun Gothic", fontSize: 34, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "sub", type: "body", x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontFace: "Malgun Gothic", fontSize: 18, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.08, w: 8, h: 0.3, fontSize: 11, color: C.accent5, margin: 0, fontFace: "Malgun Gothic" } } },
  ],
  slideNumber: { x: 12.1, y: 7.08, w: 0.6, h: 0.3, fontSize: 11, color: C.accent5, align: "right", fontFace: "Malgun Gothic" },
});
pres.defineSlideMaster({
  title: "DARK", background: { color: HX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontFace: "Malgun Gothic", fontSize: 34, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "sub", type: "body", x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontFace: "Malgun Gothic", fontSize: 18, color: C.accent6, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.08, w: 8, h: 0.3, fontSize: 11, color: C.accent6, margin: 0, fontFace: "Malgun Gothic" } } },
  ],
  slideNumber: { x: 12.1, y: 7.08, w: 0.6, h: 0.3, fontSize: 11, color: C.accent6, align: "right", fontFace: "Malgun Gothic" },
});

// ---------- helpers ----------
function content(sec, title, sub, notes, master = "CONTENT") {
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  s.addText(title, { placeholder: "title" });
  if (sub) s.addText(sub, { placeholder: "sub" });
  if (notes) s.addNotes(notes);
  return s;
}
function card(s, x, y, w, h, name, fill = C.background2) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.15, fill: { color: fill }, line: { type: "none" }, objectName: name });
}
function t(s, text, o) { s.addText(text, Object.assign({ isTextBox: true, fontFace: "Malgun Gothic", margin: 0, color: C.text1 }, o)); }

async function build() {
  // ===== 1. 표지 =====
  pres.addSection({ title: "도입" });
  let s = pres.addSlide({ masterName: "TITLE", sectionTitle: "도입" });
  s.addShape(pres.shapes.OVAL, { x: 8.3, y: 1.1, w: 5.6, h: 5.6, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "태양" });
  s.addShape(pres.shapes.OVAL, { x: 9.1, y: 1.9, w: 4.0, h: 4.0, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "태양 안쪽" });
  s.addImage({ data: await icon(gi.GiCactus, HX.lt1, 512), x: 9.9, y: 2.7, w: 2.4, h: 2.4, altText: "선인장", objectName: "선인장 아이콘" });
  t(s, "3차시  ·  함께 정하기", { x: 0.8, y: 2.0, w: 7, h: 0.5, fontSize: 18, bold: true, color: C.accent6 });
  t(s, "사막 생존 게임", { x: 0.8, y: 2.65, w: 7.4, h: 1.2, fontSize: 54, bold: true, color: C.background1 });
  t(s, "비행기가 사막에 뚝! 우리 팀의 생존율을 높여라", { x: 0.8, y: 4.0, w: 7.2, h: 0.9, fontSize: 22, color: C.background1, valign: "top" });
  t(s, "중구도시관리공단  |  소통과 협업 역량 강화  |  입화산 별난숲 자연휴양관", { x: 0.8, y: 6.5, w: 7.4, h: 0.4, fontSize: 14, color: C.accent6 });
  s.addNotes("오프닝 멘트: '오늘은 비행기를 타고 가다가 사막에 떨어진 팀이 되어 보겠습니다. 정답을 맞히는 게임이 아니라, 우리 팀이 어떻게 이야기하는지 보는 게임입니다.' 진행 시간 약 60~70분(1단계 5분, 2단계 20분, 정답 확인 10분, 점수·나눔 25분 내외).");

  // ===== 2. 오늘의 약속 =====
  s = content("도입", "사막에서의 조난, 우리 팀의 생존율을 높여라", "함께 이야기하고, 함께 결정하는 팀 게임",
    "게임의 목적을 먼저 말해 줍니다. 정답을 맞히는 것보다 '어떻게 결정했는가'가 더 중요하다는 점을 강조합니다.");
  const goals = [
    [fa.FaComments, "내 생각을 끝까지 말해보기", "틀려도 괜찮습니다. 이유와 함께 말해 봅니다."],
    [fa.FaUsers, "상대의 말을 끝까지 듣기", "직급·연차보다 '이유'가 먼저입니다."],
    [fa.FaHandshake, "이야기로 합의하기", "투표 없이, 모두가 납득하는 답을 찾습니다."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 2.2 + i * 1.5;
    card(s, 0.6, y, 12.1, 1.25, "목표 카드 " + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: 0.9, y: y + 0.2, w: 0.85, h: 0.85, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "목표 아이콘 배경 " + (i + 1) });
    s.addImage({ data: await icon(goals[i][0], HX.lt1), x: 1.1, y: y + 0.4, w: 0.45, h: 0.45, altText: goals[i][1], objectName: "목표 아이콘 " + (i + 1) });
    t(s, goals[i][1], { x: 2.1, y: y + 0.15, w: 10.2, h: 0.55, fontSize: 24, bold: true, valign: "middle" });
    t(s, goals[i][2], { x: 2.1, y: y + 0.7, w: 10.2, h: 0.4, fontSize: 16, color: C.text2, valign: "middle" });
  }

  // ===== 3. 상황 =====
  pres.addSection({ title: "게임 규칙" });
  s = content("게임 규칙", "비행기가 사막에 뚝! 떨어졌어요", "현재 상황 및 우리의 옷차림",
    "상황을 천천히 읽어 줍니다. 43도, 땅바닥 53도라는 숫자를 강조하고, '조종사는 사망했지만 우리는 모두 무사하다'는 점을 분명히 합니다.");
  const stats = [["8월", "오전 10시"], ["43℃", "기온"], ["53℃", "땅바닥"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 2.5;
    card(s, x, 2.0, 2.3, 1.45, "상황 수치 " + (i + 1), C.accent1);
    t(s, stats[i][0], { x, y: 2.1, w: 2.3, h: 0.8, fontSize: 36, bold: true, color: C.background1, align: "center", valign: "middle" });
    t(s, stats[i][1], { x, y: 2.9, w: 2.3, h: 0.4, fontSize: 16, color: C.background1, align: "center", valign: "middle" });
  }
  t(s, [
    { text: "계란도 익을 더위 속, 미국 남서부 사막 한가운데 불시착했습니다.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 10 } },
    { text: "조종사는 안타깝게 사망했지만,", options: { breakLine: true } },
    { text: "다행히 우리는 ", options: {} }, { text: "다친 사람이 아무도 없어요.", options: { bold: true } },
  ], { x: 0.6, y: 3.8, w: 7.4, h: 2.6, fontSize: 22, valign: "top" });
  card(s, 8.4, 2.0, 4.3, 4.7, "옷차림 카드");
  t(s, "우리의 옷차림", { x: 8.7, y: 2.15, w: 3.7, h: 0.55, fontSize: 22, bold: true, valign: "middle" });
  const clothes = ["손수건 한 장", "반팔 셔츠", "주머니 속 잔돈과 볼펜", "반바지", "가죽 단화"];
  for (let i = 0; i < 5; i++) {
    const y = 2.9 + i * 0.75;
    s.addShape(pres.shapes.OVAL, { x: 8.7, y: y + 0.08, w: 0.45, h: 0.45, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "옷차림 번호 " + (i + 1) });
    t(s, String(i + 1), { x: 8.7, y: y + 0.08, w: 0.45, h: 0.45, fontSize: 14, bold: true, align: "center", valign: "middle" });
    t(s, clothes[i], { x: 9.35, y, w: 3.2, h: 0.6, fontSize: 18, valign: "middle" });
  }

  // ===== 4. 세 가지 사실 =====
  s = content("게임 규칙", "우리가 알고 있는 세 가지 사실", "현재 위치와 구조 가능성",
    "세 번째 사실이 핵심입니다. '기다리면 구조대가 옵니다'를 지금은 강조하지 말고, 게임이 끝난 뒤 '정답이 왜 이렇게 나왔는지' 설명할 때 다시 짚습니다.");
  const facts = [
    ["1", "남쪽으로 약 112km 거리에 광산 마을이 있습니다.", "걸어가기엔 너무 덥고 멉니다."],
    ["2", "원래 가려던 경로에서 약 104km 벗어났습니다.", "아무도 우리가 어디 있는지 모릅니다."],
    ["3", "비행기가 도착하지 않으면, 몇 시간 내로 구조대가 출발합니다.", "기다리면 구조대가 옵니다."],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, last = i === 2;
    card(s, x, 2.1, 3.9, 4.5, "사실 카드 " + (i + 1), last ? C.accent3 : C.background2);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.4, w: 0.8, h: 0.8, fill: { color: last ? C.background1 : C.accent1 }, line: { type: "none" }, objectName: "사실 번호 " + (i + 1) });
    t(s, facts[i][0], { x: x + 0.3, y: 2.4, w: 0.8, h: 0.8, fontSize: 28, bold: true, align: "center", valign: "middle", color: last ? C.accent3 : C.background1 });
    t(s, facts[i][1], { x: x + 0.3, y: 3.4, w: 3.3, h: 1.9, fontSize: 20, bold: true, valign: "top", color: last ? C.background1 : C.text1 });
    t(s, facts[i][2], { x: x + 0.3, y: 5.5, w: 3.3, h: 0.9, fontSize: 17, valign: "top", bold: last, color: last ? C.background1 : C.text2 });
  }

  // ===== 5. 15가지 물건 =====
  s = content("게임 규칙", "큰일 났어요! 비행기에 불이 붙었다!", "살아남는 데 도움이 될 15가지 물건 · 다 타버리기 전에 1위부터 15위까지 순위를 정해봅시다",
    "비행기 안에 남은 물건은 단 15가지입니다. 참가자에게 '물건 목록 활동지'를 나눠 주세요. 물건의 개수나 크기는 원작과 동일하게 '1개씩, 물은 1L'로 가정합니다.");
  const items = [
    ["손전등", gi.GiFlashlight], ["잭나이프", gi.GiSwissArmyKnife], ["항공지도", gi.GiTreasureMap], ["비닐 우비", gi.GiHood], ["나침반", gi.GiCompass],
    ["붕대", gi.GiFirstAidKit], ["권총", gi.GiPistolGun], ["낙하산", gi.GiParachute], ["소금 알약", gi.GiSaltShaker], ["물 1L", gi.GiWaterBottle],
    ["동물 책", gi.GiBookCover], ["선글라스", gi.GiSunglasses], ["보드카", gi.GiBrandyBottle], ["두꺼운 옷", gi.GiMonclerJacket], ["손거울", gi.GiMirrorMirror],
  ];
  for (let i = 0; i < 15; i++) {
    const r = Math.floor(i / 5), c = i % 5;
    const x = 0.77 + c * 2.4, y = 2.0 + r * 1.65;
    card(s, x, y, 2.2, 1.5, "물건 카드 " + items[i][0]);
    s.addImage({ data: await icon(items[i][1], HX.dk2), x: x + 0.8, y: y + 0.15, w: 0.6, h: 0.6, altText: items[i][0], objectName: "아이콘 " + items[i][0] });
    t(s, items[i][0], { x, y: y + 0.85, w: 2.2, h: 0.5, fontSize: 18, bold: true, align: "center", valign: "middle" });
  }

  // ===== 6. 1단계 =====
  s = content("게임 규칙", "1단계: 조용히 나만의 답 정하기", "게임 진행 방법 (총 3단계)",
    "개인 순위는 반드시 종이에 적게 하고, 2단계에서 제출 전까지 서로 보여 주지 않도록 안내합니다. 개인 점수 계산에 쓰입니다.");
  const steps = [["1단계", "혼자 정하기", "5분"], ["2단계", "팀이 하나로", "20분"], ["3단계", "정답 확인", "10분"]];
  for (let i = 0; i < 3; i++) {
    const x = 1.2 + i * 4.2, on = i === 0;
    s.addShape(pres.shapes.OVAL, { x, y: 2.0, w: 2.4, h: 2.4, fill: { color: on ? C.accent1 : C.background2 }, line: { color: C.accent6, width: 2 }, objectName: "단계 원 " + (i + 1) });
    t(s, [{ text: steps[i][0], options: { breakLine: true, fontSize: 16 } }, { text: steps[i][1], options: { breakLine: true, fontSize: 22, bold: true } }, { text: steps[i][2], options: { fontSize: 18 } }],
      { x, y: 2.0, w: 2.4, h: 2.4, align: "center", valign: "middle", color: on ? C.background1 : C.text1 });
    if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.65, y: 2.95, w: 1.2, h: 0.5, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "화살표 " + (i + 1) });
  }
  card(s, 1.2, 4.9, 10.9, 1.9, "1단계 규칙 카드");
  t(s, "[1단계 규칙]", { x: 1.6, y: 5.0, w: 10, h: 0.45, fontSize: 18, bold: true, color: C.accent1 });
  t(s, [
    { text: "아직 옆 사람과 이야기하지 마세요. 내 생각대로 1~15위를 적어봅니다.", options: { breakLine: true } },
    { text: "가장 중요한 것은 '왜 이걸 1위로 했지?'라는 나만의 이유를 하나씩 생각해두는 것입니다.", options: {} },
  ], { x: 1.6, y: 5.45, w: 10.1, h: 1.2, fontSize: 18, valign: "top" });

  // ===== 7. 2단계 규칙 =====
  s = content("게임 규칙", "2단계: 투표 금지! 가위바위보 금지!", "우리 팀의 약속 세 가지",
    "공단 맞춤 규칙: 직급·연차가 아니라 '이유'로 말하기. 기록 담당은 진행자가 아니라 '받아 적는 사람'임을 강조하세요. 직급이 높은 사람이 맡지 않도록 막내 또는 지원자를 권해도 좋습니다.");
  const rules = [
    [fa.FaTimes, HX.a1, "다수결은 반칙!", "오직 이야기로만 정합니다. 모두가 말할 수 있게 기록 담당 1명을 정해주세요."],
    [fa.FaComments, HX.a3, "끝까지 말하기", "내 의견을 끝까지 말해보세요. \"저는 이래서 중요한 것 같아요!\""],
    [fa.FaHandshake, HX.a4, "기분 좋게 양보", "상대방의 말이 맞다고 생각되면 기분 좋게 양보하세요."],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1;
    card(s, x, 2.0, 3.9, 3.4, "규칙 카드 " + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.3, w: 0.9, h: 0.9, fill: { color: rules[i][1] }, line: { type: "none" }, objectName: "규칙 아이콘 배경 " + (i + 1) });
    s.addImage({ data: await icon(rules[i][0], HX.lt1), x: x + 0.52, y: 2.52, w: 0.46, h: 0.46, altText: rules[i][2], objectName: "규칙 아이콘 " + (i + 1) });
    t(s, (i + 1) + ". " + rules[i][2], { x: x + 0.3, y: 3.4, w: 3.3, h: 0.55, fontSize: 22, bold: true, valign: "middle" });
    t(s, rules[i][3], { x: x + 0.3, y: 4.0, w: 3.3, h: 1.45, fontSize: 16, valign: "top", color: C.text2 });
  }
  card(s, 0.6, 5.75, 12.1, 1.0, "특별 규칙 배너", C.accent2);
  t(s, [{ text: "오늘의 특별 규칙  ", options: { bold: true } }, { text: "직급과 연차 말고, ‘이유’로 이야기합니다." }],
    { x: 0.9, y: 5.75, w: 11.5, h: 1.0, fontSize: 22, valign: "middle", color: C.text1 });

  // ===== 8. 타이머 =====
  s = content("게임 규칙", "지금부터 시작!", "잘 묻고, 잘 들어주는 팀이 결과도 좋습니다", "타이머를 켜고 시작합니다. 1단계 5분 → 2단계 20분. 2단계 중간(10분)에 한 번 '아직 말 안 한 분 있나요?'를 물어 줍니다.", "DARK");
  s.addShape(pres.shapes.OVAL, { x: 4.9, y: 2.2, w: 3.5, h: 3.5, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "타이머 원" });
  s.addImage({ data: await icon(gi.GiHourglass, HX.lt1, 512), x: 5.75, y: 2.55, w: 1.8, h: 1.8, altText: "모래시계", objectName: "모래시계" });
  t(s, "혼자 5분  →  팀이 하나로 20분", { x: 0.6, y: 5.95, w: 12.1, h: 0.7, fontSize: 28, bold: true, color: C.background1, align: "center", valign: "middle" });

  // ===== 9. 발표 =====
  s = content("게임 규칙", "우리 팀의 1위는 무엇인가요?", "기록 담당의 결과 발표",
    "각 팀 기록 담당이 1~3위와 이유를 한 문장으로 발표합니다. 정답은 아직 공개하지 않습니다. '의견이 부딪힌 물건'은 뒤에 나오는 소통 돌아보기에서 다시 씁니다.");
  card(s, 0.6, 2.0, 6.9, 4.8, "발표 요청 카드");
  t(s, "기록 담당님!", { x: 1.0, y: 2.3, w: 6.1, h: 0.6, fontSize: 26, bold: true, color: C.accent1 });
  t(s, "우리 팀의 1위, 2위, 3위와 그 이유를 한 문장으로 발표해주세요.", { x: 1.0, y: 3.0, w: 6.1, h: 1.6, fontSize: 24, valign: "top" });
  t(s, "예) \"1위는 ○○입니다. 왜냐하면 ~입니다.\"", { x: 1.0, y: 5.2, w: 6.1, h: 1.0, fontSize: 16, color: C.text2, valign: "top" });
  card(s, 7.8, 2.0, 4.9, 4.8, "질문 카드", C.accent3);
  s.addImage({ data: await icon(fa.FaComments, HX.lt1), x: 8.2, y: 2.35, w: 0.7, h: 0.7, altText: "대화", objectName: "질문 아이콘" });
  t(s, "순위를 정하는 동안", { x: 8.2, y: 3.3, w: 4.2, h: 0.55, fontSize: 20, color: C.background1 });
  t(s, "가장 의견이 부딪힌 물건은 무엇이었나요?", { x: 8.2, y: 3.9, w: 4.2, h: 2.2, fontSize: 28, bold: true, color: C.background1, valign: "top" });

  // ===== 10. 힌트 =====
  pres.addSection({ title: "정답 공개" });
  s = content("정답 공개", "정답 공개 전 힌트! 걸어가면 안 돼요", "사막 생존의 핵심 전략",
    "핵심 메시지: 43도 더위에 112km를 걷는 것은 불가능합니다. 구조대는 반드시 찾아오므로 정답은 '기다리며 버티기'입니다. 걷는 쪽을 선택한 팀이 있었다면 비난하지 말고 '왜 걷기로 했는지' 이유를 물어봅니다.");
  card(s, 0.6, 1.95, 12.1, 1.15, "핵심 메시지", C.accent1);
  t(s, [{ text: "43도 더위에 112km를 걷는 것은 불가능합니다! 구조대는 반드시 찾아오므로 정답은 " }, { text: "기다리며 버티기", options: { bold: true, underline: { style: "sng" } } }, { text: " 입니다." }],
    { x: 0.9, y: 1.95, w: 11.5, h: 1.15, fontSize: 22, color: C.background1, valign: "middle" });
  card(s, 0.6, 3.35, 5.6, 3.5, "오답 카드");
  s.addShape(pres.shapes.OVAL, { x: 0.9, y: 3.6, w: 0.9, h: 0.9, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "오답 표시" });
  s.addImage({ data: await icon(fa.FaTimes, HX.lt1), x: 1.12, y: 3.82, w: 0.46, h: 0.46, altText: "X", objectName: "오답 아이콘" });
  s.addImage({ data: await icon(fa.FaWalking, HX.dk2), x: 4.7, y: 3.6, w: 1.1, h: 1.1, altText: "걷는 사람", objectName: "걷기 아이콘" });
  t(s, "걸어서 탈출", { x: 0.9, y: 4.75, w: 5, h: 0.6, fontSize: 24, bold: true });
  t(s, "더위와 탈수로 오히려 위험해집니다.", { x: 0.9, y: 5.4, w: 5, h: 1.2, fontSize: 18, color: C.text2, valign: "top" });
  card(s, 6.5, 3.35, 6.2, 1.6, "전략 카드 1");
  s.addShape(pres.shapes.OVAL, { x: 6.8, y: 3.7, w: 0.9, h: 0.9, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "전략 1 표시" });
  s.addImage({ data: await icon(fa.FaCheck, HX.lt1), x: 7.02, y: 3.92, w: 0.46, h: 0.46, altText: "O", objectName: "전략 1 아이콘" });
  t(s, "핵심 전략 1: 구조대에게 신호 보내기", { x: 8.0, y: 3.5, w: 4.5, h: 0.6, fontSize: 18, bold: true, valign: "middle" });
  t(s, "\"우리 여기 있어요!\"", { x: 8.0, y: 4.15, w: 4.5, h: 0.6, fontSize: 18, color: C.text2, valign: "middle" });
  card(s, 6.5, 5.2, 6.2, 1.65, "전략 카드 2");
  s.addShape(pres.shapes.OVAL, { x: 6.8, y: 5.55, w: 0.9, h: 0.9, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "전략 2 표시" });
  s.addImage({ data: await icon(fa.FaCheck, HX.lt1), x: 7.02, y: 5.77, w: 0.46, h: 0.46, altText: "O", objectName: "전략 2 아이콘" });
  t(s, "핵심 전략 2: 물을 지키고 몸을 보호하기", { x: 8.0, y: 5.35, w: 4.5, h: 0.6, fontSize: 18, bold: true, valign: "middle" });
  t(s, "(탈수 방지)", { x: 8.0, y: 6.0, w: 4.5, h: 0.6, fontSize: 18, color: C.text2, valign: "middle" });

  // ===== 11. 정답 1~4위 =====
  s = content("정답 공개", "생존 전문가의 정답 (1위~4위)", "신호 보내기와 물 지키기",
    "1위 거울: 햇빛을 반사해 약 100km 밖까지 신호가 가능하다고 알려져 있습니다(양초 700만 개 밝기). 2위 두꺼운 옷: 땀 증발을 막아 몸속 수분을 지켜 줍니다. 3위 물 1L: 목마름을 달래기보다 아껴 마셔야 합니다. 4위 손전등: 밤에 신호를 보내고, 뚜껑은 물그릇으로 활용합니다.");
  const top4 = [
    ["1위", "화장용 손거울", "햇빛을 반사해 100km 밖까지 신호 가능! 양초 700만 개 밝기", gi.GiMirrorMirror],
    ["2위", "두꺼운 옷", "더운데 두꺼운 옷? 땀 증발을 막아 몸속 수분을 지켜줍니다", gi.GiMonclerJacket],
    ["3위", "물 1L", "목마름 달래기보다 아껴 마셔야 합니다", gi.GiWaterBottle],
    ["4위", "손전등", "밤에 신호 보내기, 뚜껑은 물그릇으로 활용", gi.GiFlashlight],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.08;
    card(s, x, 2.0, 2.9, 4.85, "정답 카드 " + top4[i][0], i === 0 ? C.accent2 : C.background2);
    s.addShape(pres.shapes.OVAL, { x: x + 0.95, y: 2.25, w: 1.0, h: 1.0, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "순위 배지 " + top4[i][0] });
    t(s, top4[i][0], { x: x + 0.95, y: 2.25, w: 1.0, h: 1.0, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle" });
    s.addImage({ data: await icon(top4[i][3], HX.dk2), x: x + 0.95, y: 3.45, w: 1.0, h: 1.0, altText: top4[i][1], objectName: "아이콘 " + top4[i][1] });
    t(s, top4[i][1], { x: x + 0.15, y: 4.6, w: 2.6, h: 0.55, fontSize: 20, bold: true, align: "center", valign: "middle" });
    t(s, top4[i][2], { x: x + 0.2, y: 5.2, w: 2.5, h: 1.55, fontSize: 14, align: "center", valign: "top", color: C.text2 });
  }

  // ===== 12. 정답 5~8위 =====
  s = content("정답 공개", "생존 전문가의 정답 (5위~8위)", "그늘 만들기와 생존 도구",
    "5위 낙하산: 빨강·하양 천막을 치면 그늘이 되고 하늘에서 잘 보입니다. 6위 잭나이프: 선인장을 잘라 수분을 섭취할 수 있다는 근거입니다. 7위 비닐 우비: 새벽 이슬을 받아 마실 수 있습니다. 8위 권총: 쏘는 것이 아니라 '탕!' 소리로 구조 신호를 보냅니다.");
  const mid4 = [
    ["5위", "낙하산", "빨강·하양 천막을 치면 그늘이 되고, 하늘에서 잘 보입니다", gi.GiParachute],
    ["6위", "잭나이프", "선인장을 잘라 수분을 섭취할 수 있습니다", gi.GiSwissArmyKnife],
    ["7위", "비닐 우비", "새벽 이슬을 받아 마실 수 있습니다", gi.GiHood],
    ["8위", "권총", "쏘는 것이 아니라, ‘탕!’ 소리로 구조 신호를 보냅니다", gi.GiPistolGun],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 2.0 + i * 1.22;
    card(s, 0.6, y, 12.1, 1.08, "정답 행 " + mid4[i][0]);
    s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + 0.14, w: 0.8, h: 0.8, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "순위 배지 " + mid4[i][0] });
    t(s, mid4[i][0], { x: 0.85, y: y + 0.14, w: 0.8, h: 0.8, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
    s.addImage({ data: await icon(mid4[i][3], HX.dk2), x: 1.95, y: y + 0.2, w: 0.68, h: 0.68, altText: mid4[i][1], objectName: "아이콘 " + mid4[i][1] });
    t(s, mid4[i][1], { x: 2.95, y: y + 0.1, w: 2.6, h: 0.88, fontSize: 22, bold: true, valign: "middle" });
    t(s, mid4[i][2], { x: 5.6, y: y + 0.1, w: 6.9, h: 0.88, fontSize: 18, valign: "middle", color: C.text2 });
  }

  // ===== 13. 9~15위 =====
  s = content("정답 공개", "오히려 위험한 물건들 (9위~15위)", "걸어서 이동할 때 필요한 것들",
    "9~15위의 공통점은 '이동할 때 필요하다'는 것입니다. 우리는 기다려야 합니다. 특히 물 없이 소금 알약을 먹거나 보드카를 마시면 탈수가 심해져 치명적입니다.");
  const low = [["9위", "선글라스"], ["10위", "붕대"], ["11위", "나침반"], ["12위", "항공지도"], ["13위", "식용동물 책"], ["14위", "보드카"], ["15위", "소금 알약"]];
  for (let i = 0; i < 7; i++) {
    const y = 2.0 + i * 0.7, danger = i >= 5;
    card(s, 0.6, y, 6.0, 0.6, "순위 행 " + low[i][0], danger ? C.accent1 : C.background2);
    t(s, low[i][0], { x: 0.85, y, w: 1.2, h: 0.6, fontSize: 18, bold: true, valign: "middle", color: danger ? C.background1 : C.accent1 });
    t(s, low[i][1], { x: 2.2, y, w: 4.2, h: 0.6, fontSize: 18, bold: true, valign: "middle", color: danger ? C.background1 : C.text1 });
  }
  card(s, 6.9, 2.0, 5.8, 4.8, "공통점 카드", C.accent3);
  t(s, "이 물건들의 공통점은", { x: 7.3, y: 2.3, w: 5.0, h: 0.5, fontSize: 18, color: C.background1 });
  t(s, "이동할 때 필요하다는 것입니다.", { x: 7.3, y: 2.85, w: 5.0, h: 1.0, fontSize: 26, bold: true, color: C.background1, valign: "top" });
  t(s, "우리는 기다려야 합니다!", { x: 7.3, y: 4.0, w: 5.0, h: 0.7, fontSize: 24, bold: true, color: C.accent2, valign: "middle" });
  t(s, "특히 물 없이 소금 알약을 먹거나 보드카를 마시면 치명적입니다.", { x: 7.3, y: 4.9, w: 5.0, h: 1.6, fontSize: 18, color: C.background1, valign: "top" });

  // ===== 14. 정답표 한눈에 =====
  s = content("정답 공개", "정답표 한눈에 보기", "점수 계산용 · 팀 순위와 비교해 보세요",
    "점수 계산 때 사용하는 정답표입니다. 투사해 두고 각자 개인 순위와 비교하게 합니다.");
  const ans = ["손거울", "두꺼운 옷", "물 1L", "손전등", "낙하산", "잭나이프", "비닐 우비", "권총", "선글라스", "붕대", "나침반", "항공지도", "동물 책", "보드카", "소금 알약"];
  for (let col = 0; col < 3; col++) {
    for (let r = 0; r < 5; r++) {
      const n = col * 5 + r;
      const x = 0.6 + col * 4.1, y = 2.0 + r * 0.95;
      const best = n < 5;
      card(s, x, y, 3.9, 0.8, "정답표 " + (n + 1) + "위", best ? C.accent2 : C.background2);
      s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.1, w: 0.6, h: 0.6, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "정답표 번호 " + (n + 1) });
      t(s, String(n + 1), { x: x + 0.15, y: y + 0.1, w: 0.6, h: 0.6, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
      t(s, ans[n], { x: x + 0.95, y, w: 2.8, h: 0.8, fontSize: 20, bold: true, valign: "middle" });
    }
  }
  t(s, "※ 노란색 1~5위가 ‘베스트 5’ (거울, 옷, 물, 전등, 낙하산)", { x: 0.6, y: 6.8, w: 12.1, h: 0.25, fontSize: 12, color: C.text2 });

  // ===== 15. 점수 내기 =====
  s = content("정답 공개", "점수 내기: 오차점수와 협업 점수", "정답과 가까울수록, 함께 만든 답일수록 높은 점수",
    "오차점수 예시: 손거울을 3위로 적었다면 |3-1|=2점. 15개를 모두 더합니다. 점수는 낮을수록 좋습니다. 협업 점수는 정확도 40 + 시너지 30 + 참여도 30 = 100점입니다. 참여도는 스태프가 현장에서 체크하고, 소수 의견 채택은 팀이 직접 표시하게 하면 공정합니다.");
  card(s, 0.6, 2.0, 5.2, 4.8, "오차점수 카드");
  t(s, "① 오차점수 계산", { x: 0.9, y: 2.2, w: 4.6, h: 0.55, fontSize: 22, bold: true, color: C.accent1 });
  t(s, "물건마다 |내 순위 − 정답 순위|를 구해 15개를 모두 더합니다. 낮을수록 좋습니다.", { x: 0.9, y: 2.85, w: 4.6, h: 1.4, fontSize: 18, valign: "top" });
  card(s, 0.9, 4.45, 4.6, 2.1, "계산 예시", C.background1);
  t(s, [{ text: "예) 손거울을 3위로 적었다면", options: { breakLine: true } }, { text: "|3 − 1| = 2점", options: { bold: true, fontSize: 24, color: C.accent1, breakLine: true } }, { text: "이런 점수를 15개 모두 더합니다", options: {} }],
    { x: 1.1, y: 4.55, w: 4.2, h: 1.9, fontSize: 16, valign: "middle", color: C.text1 });
  card(s, 6.1, 2.0, 6.6, 4.8, "협업 점수 카드");
  t(s, "② 협업 점수 (100점)", { x: 6.4, y: 2.2, w: 6.0, h: 0.55, fontSize: 22, bold: true, color: C.accent3 });
  const parts = [
    ["40", "팀 정확도", "팀 오차점수가 낮을수록 높은 점수"],
    ["30", "시너지", "개인 평균보다 팀이 얼마나 좋아졌나 (최고 개인보다 좋으면 보너스)"],
    ["30", "참여도", "전원 발언 15 + 소수 의견 채택 15"],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 3.0 + i * 1.25;
    s.addShape(pres.shapes.OVAL, { x: 6.4, y: y + 0.1, w: 0.9, h: 0.9, fill: { color: C.accent3 }, line: { type: "none" }, objectName: "배점 원 " + (i + 1) });
    t(s, parts[i][0], { x: 6.4, y: y + 0.1, w: 0.9, h: 0.9, fontSize: 22, bold: true, color: C.background1, align: "center", valign: "middle" });
    t(s, parts[i][1], { x: 7.5, y: y, w: 5.0, h: 0.45, fontSize: 18, bold: true, valign: "middle" });
    t(s, parts[i][2], { x: 7.5, y: y + 0.45, w: 5.0, h: 0.7, fontSize: 14, valign: "top", color: C.text2 });
  }

  // ===== 16. 집단 지성 =====
  s = content("정답 공개", "점수 내기 & 오늘 게임의 비밀", "베스트 5 맞히기와 집단 지성",
    "차트의 숫자는 이해를 돕기 위한 예시입니다. 실제 결과는 팀별 점수를 입력해 비교합니다. 대부분의 팀에서 팀 점수가 개인 평균보다 좋아지고, 때로는 팀 안의 최고 개인보다도 좋아집니다. 이것이 집단 지성입니다.");
  s.addChart(pres.charts.BAR, [{ name: "오차점수 (낮을수록 좋음)", labels: ["나 혼자 (개인 평균)", "우리 팀"], values: [48, 30] }], {
    x: 0.6, y: 2.0, w: 6.2, h: 4.8, barDir: "col", chartColors: [HX.a5, HX.a3], varyColors: true,
    showTitle: true, title: "오차점수 비교 (예시)", titleFontFace: "+mn-lt", titleFontSize: 16, titleColor: HX.dk1,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontFace: "+mn-lt", dataLabelFontSize: 16, dataLabelColor: HX.dk1,
    catAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 14, catAxisLabelColor: HX.dk1,
    valAxisLabelFontFace: "+mn-lt", valAxisLabelFontSize: 12, valAxisLabelColor: HX.a5, valAxisMinVal: 0, valAxisMaxVal: 60,
    valGridLine: { color: "E6D9BF", size: 0.75 }, catGridLine: { style: "none" }, showLegend: false,
  });
  card(s, 7.1, 2.0, 5.6, 4.8, "집단 지성 설명 카드");
  t(s, "내가 적은 1~5위 중, 전문가의 정답 베스트 5가 몇 개 있나요?", { x: 7.4, y: 2.25, w: 5.0, h: 1.3, fontSize: 18, bold: true, valign: "top" });
  t(s, "(거울, 옷, 물, 전등, 낙하산)", { x: 7.4, y: 3.5, w: 5.0, h: 0.4, fontSize: 16, color: C.text2 });
  t(s, "개인 점수와 팀 점수를 비교해보세요!", { x: 7.4, y: 4.1, w: 5.0, h: 0.8, fontSize: 18, valign: "top" });
  t(s, [{ text: "함께 이야기해서 정한 답이 혼자 정한 답보다 높습니다. 이것이 " }, { text: "‘집단 지성의 비밀’", options: { bold: true, color: C.accent1 } }, { text: " 입니다." }],
    { x: 7.4, y: 5.0, w: 5.0, h: 1.6, fontSize: 18, valign: "top" });

  // ===== 17. 소통 돌아보기 =====
  pres.addSection({ title: "되돌아보기" });
  s = content("되돌아보기", "사막에서도, 일터에서도 똑같아요", "우리 팀의 소통 방식 돌아보기 · 오늘 우리 팀에는 어떤 행동이 많았나요?",
    "두 칸에 해당하는 행동에 스티커 또는 손으로 체크하게 합니다. 의견을 내기 어려웠던 순간이 있었는지 조심스럽게 묻고, 말하지 못한 사람을 지목하지 않도록 주의합니다.");
  card(s, 0.6, 2.0, 5.95, 0.9, "좋은 행동 머리글", C.accent2);
  t(s, "[팀을 살리는 행동]", { x: 0.6, y: 2.0, w: 5.95, h: 0.9, fontSize: 22, bold: true, align: "center", valign: "middle" });
  card(s, 6.75, 2.0, 5.95, 0.9, "힘든 행동 머리글", C.accent5);
  t(s, "[팀을 힘들게 하는 행동]", { x: 6.75, y: 2.0, w: 5.95, h: 0.9, fontSize: 22, bold: true, align: "center", valign: "middle", color: C.background1 });
  const good = ["어떻게 생각하세요? 물어봐 주기", "끝까지 듣고 고개 끄덕여주기", "다정하게 말하고 “오~” 인정하기"];
  const bad = ["내 말만 우기고 밀어붙이기", "남의 의견에 빈정대기", "입 다물고 구경만 하기 (방관)"];
  for (let i = 0; i < 3; i++) {
    const y = 3.1 + i * 1.25;
    card(s, 0.6, y, 5.95, 1.1, "좋은 행동 " + (i + 1));
    t(s, "•  " + good[i], { x: 0.9, y, w: 5.4, h: 1.1, fontSize: 18, valign: "middle" });
    card(s, 6.75, y, 5.95, 1.1, "힘든 행동 " + (i + 1));
    t(s, "•  " + bad[i], { x: 7.05, y, w: 5.4, h: 1.1, fontSize: 18, valign: "middle" });
  }

  // ===== 18. 이야기 나누기 =====
  s = content("되돌아보기", "의견이 다를 때, 나는 어떤 모양?", "3차시  |  이야기 나누기",
    "팀별로 5~10분 나눈 뒤, 자원하는 1~2팀만 전체에 공유합니다. 마지막 질문은 내일부터 실천할 한 가지를 포스트잇에 적게 해도 좋습니다.");
  const qs = [
    ["의견 충돌 순간의 나의 모양 돌아보기", "내가 의견을 냈을 때/말하지 못했을 때, 어떤 기분이었나요?"],
    ["점수 좋은 팀의 비밀: 질문 · 경청 · 양보", "오늘 가장 도움이 된 말 한마디는 무엇이었나요?"],
    ["내 의견이 채택된 순간의 설득 비결", "누구의 한마디가 순위를 바꿨나요? 그 말은 어떻게 들렸나요?"],
    ["1차시 도형 + 2차시 확인 습관의 실전 적용", "내일 회의에서 바꿔 볼 한 가지는 무엇인가요?"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + (i % 2) * 6.15, y = 2.0 + Math.floor(i / 2) * 2.5;
    card(s, x, y, 5.95, 2.3, "질문 카드 " + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "질문 번호 " + (i + 1) });
    t(s, String(i + 1), { x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle" });
    t(s, qs[i][0], { x: x + 1.2, y: y + 0.2, w: 4.5, h: 0.95, fontSize: 18, bold: true, valign: "middle" });
    t(s, qs[i][1], { x: x + 0.3, y: y + 1.3, w: 5.4, h: 0.9, fontSize: 16, color: C.text2, valign: "top" });
  }

  // ===== 19. 정리 =====
  s = content("되돌아보기", "3차시에서 발견한 것", "정리", "마무리 멘트: '혼자 가면 빠르지만, 함께 가면 사막에서도 생존합니다. 오늘 서로의 말에 귀 기울인 경험을 내일 일터로 가져가 주세요.'", "DARK");
  const found = ["혼자 정한 답보다 좋은 팀의 답", "투표 없이 이야기로 합의한 경험", "갈등 = 더 좋은 결정의 재료"];
  for (let i = 0; i < 3; i++) {
    const y = 2.0 + i * 1.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.9, rectRadius: 0.15, fill: { color: C.text2 }, line: { type: "none" }, objectName: "발견 카드 " + (i + 1) });
    s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + 0.15, w: 0.6, h: 0.6, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "발견 번호 " + (i + 1) });
    t(s, String(i + 1), { x: 0.85, y: y + 0.15, w: 0.6, h: 0.6, fontSize: 18, bold: true, align: "center", valign: "middle" });
    t(s, found[i], { x: 1.75, y, w: 10.7, h: 0.9, fontSize: 22, bold: true, valign: "middle", color: C.background1 });
  }
  card(s, 0.6, 5.5, 12.1, 1.35, "마무리 문장", C.accent1);
  t(s, [{ text: "혼자 가면 빠르지만,", options: { breakLine: true } }, { text: "함께 가면 사막에서도 생존", options: { bold: true } }],
    { x: 0.9, y: 5.5, w: 11.5, h: 1.35, fontSize: 28, color: C.background1, valign: "middle" });

  await pres.writeFile({ fileName: "desert-survival-gongdan.pptx" });
  await applyTheme("desert-survival-gongdan.pptx", THEME);
  console.log("done");
}
build().catch((e) => { console.error(e); process.exit(1); });
