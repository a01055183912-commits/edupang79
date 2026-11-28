// 사막 생존 게임 15가지 물건. ITEMS는 화면에 보여 주는 순서(정답 순서 아님), ANSWER는 전문가 정답 순서.
export const ITEMS = [
  { id: 'flashlight', name: '손전등', emoji: '🔦' },
  { id: 'knife', name: '잭나이프', emoji: '🔪' },
  { id: 'map', name: '항공지도', emoji: '🗺️' },
  { id: 'raincoat', name: '비닐 우비', emoji: '🌧️' },
  { id: 'compass', name: '나침반', emoji: '🧭' },
  { id: 'bandage', name: '붕대', emoji: '🩹' },
  { id: 'pistol', name: '권총', emoji: '🔫' },
  { id: 'parachute', name: '낙하산', emoji: '🪂' },
  { id: 'salt', name: '소금 알약', emoji: '🧂' },
  { id: 'water', name: '물 1L', emoji: '💧' },
  { id: 'book', name: '동물 책', emoji: '📖' },
  { id: 'sunglasses', name: '선글라스', emoji: '🕶️' },
  { id: 'vodka', name: '보드카', emoji: '🍾' },
  { id: 'coat', name: '두꺼운 옷', emoji: '🧥' },
  { id: 'mirror', name: '손거울', emoji: '🪞' },
];

export const ANSWER = [
  ['mirror', '햇빛을 반사해 100km 밖까지 신호 가능! 양초 700만 개 밝기'],
  ['coat', '더운데 두꺼운 옷? 땀 증발을 막아 몸속 수분을 지켜줍니다'],
  ['water', '목마름 달래기보다 아껴 마셔야 합니다'],
  ['flashlight', '밤에 신호 보내기, 뚜껑은 물그릇으로 활용'],
  ['parachute', '빨강·하양 천막을 치면 그늘이 되고, 하늘에서 잘 보입니다'],
  ['knife', '선인장을 잘라 수분을 섭취할 수 있습니다'],
  ['raincoat', '새벽 이슬을 받아 마실 수 있습니다'],
  ['pistol', '쏘는 것이 아니라 ‘탕!’ 소리로 구조 신호를 보냅니다'],
  ['sunglasses', '이동할 때 필요한 물건입니다'],
  ['bandage', '이동할 때 필요한 물건입니다'],
  ['compass', '이동할 때 필요한 물건입니다'],
  ['map', '이동할 때 필요한 물건입니다'],
  ['book', '이동할 때 필요한 물건입니다'],
  ['vodka', '마시면 탈수가 심해져 위험합니다'],
  ['salt', '물 없이 먹으면 치명적입니다'],
].map(([id, why], i) => ({ id, why, rank: i + 1 }));

export const ANSWER_IDS = ANSWER.map((a) => a.id);
export const ITEM_IDS = ITEMS.map((i) => i.id);
