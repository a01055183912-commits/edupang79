import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorScore, teamResult, isValidRanking, reflection } from './scoring.mjs';
import { ANSWER_IDS, ITEM_IDS } from './items.mjs';

const rev = [...ANSWER_IDS].reverse();

test('정답 그대로면 오차 0, 완전 반대면 112', () => {
  assert.equal(errorScore(ANSWER_IDS), 0);
  assert.equal(errorScore(rev), 112);
});
test('거울을 3위로 적고 2·3위를 한 칸씩 올리면 오차 4', () => {
  const r = [...ANSWER_IDS]; [r[0], r[1], r[2]] = [r[1], r[2], r[0]];
  assert.equal(errorScore(r), 4);
});
test('잘못된 순위는 거부', () => {
  assert.equal(isValidRanking(ITEM_IDS), true);
  assert.equal(isValidRanking(ITEM_IDS.slice(1)), false);
  assert.equal(isValidRanking([...ITEM_IDS.slice(1), ITEM_IDS[1]]), false);
  assert.throws(() => errorScore(['x']));
});
test('팀 정답 + 전원 발언 + 소수 의견 = 100점', () => {
  const r = teamResult({ members: [rev, rev], team: ANSWER_IDS, memberCount: 2, spokenCount: 2, minorityAdopted: true });
  assert.equal(r.accuracy, 40); assert.equal(r.synergy, 30); assert.equal(r.participation, 30); assert.equal(r.total, 100);
});
test('팀이 개인보다 못하면 시너지 0', () => {
  const r = teamResult({ members: [ANSWER_IDS], team: rev, memberCount: 1, spokenCount: 1, minorityAdopted: false });
  assert.equal(r.synergy, 0); assert.equal(r.accuracy, 0);
});
test('발언 안 한 팀원 1명당 -3점, 미평가면 0점 표시', () => {
  const base = { members: [ANSWER_IDS], team: ANSWER_IDS, memberCount: 5, minorityAdopted: false };
  assert.equal(teamResult({ ...base, spokenCount: 3 }).speak, 9);
  assert.equal(teamResult({ ...base, spokenCount: null }).participationEvaluated, false);
  assert.equal(teamResult({ ...base, spokenCount: 99 }).speak, 15);
});
test('시너지: 개선폭×1.5 (최대 20) + 팀이 최고 개인보다 좋으면 +10', () => {
  const swap = (a, i, j) => { const r = [...a]; [r[i], r[j]] = [r[j], r[i]]; return r; };
  const m1 = swap(rev, 0, 1), m2 = swap(rev, 2, 3); // 둘 다 매우 나쁨
  const team = swap(ANSWER_IDS, 0, 1); // 오차 2
  const r = teamResult({ members: [m1, m2], team, memberCount: 2, spokenCount: 2, minorityAdopted: false });
  assert.equal(r.synergyBonus, 10); assert.equal(r.synergy, 30);
});

test('반영도: 같은 순위면 100%, 완전 반대면 0%', () => {
  assert.equal(reflection(ANSWER_IDS, ANSWER_IDS).percent, 100);
  assert.equal(reflection(ANSWER_IDS, rev).percent, 0);
});
test('반영도: 내 1위의 팀 순위와 반영된/아쉬운 물건', () => {
  const team = [...ANSWER_IDS]; // 내 순위는 거울을 15위로 보낸 경우
  const mine = [...ANSWER_IDS.slice(1), ANSWER_IDS[0]];
  const r = reflection(mine, team);
  assert.equal(r.mine1.id, ANSWER_IDS[1]); assert.equal(r.mine1.team, 2);
  assert.equal(r.missed[0].id, ANSWER_IDS[0]); assert.equal(r.missed[0].diff, 14);
  assert.ok(r.percent > 0 && r.percent < 100);
});
