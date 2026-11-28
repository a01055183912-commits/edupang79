// 점수 계산(100점): 팀 정확도 40 + 시너지 30 + 참여도 30. 서버와 테스트가 함께 쓴다.
import { ANSWER_IDS, ITEM_IDS } from './items.mjs';

export const ERR_CAP = 60; // 오차점수 60 이상이면 정확도 0점

export function isValidRanking(r) {
  return Array.isArray(r) && r.length === ITEM_IDS.length && new Set(r).size === r.length && r.every((x) => ITEM_IDS.includes(x));
}

// 물건마다 |내 순위 - 정답 순위| 를 더한다. 낮을수록 좋다.
export function errorScore(ranking) {
  if (!isValidRanking(ranking)) throw new Error('invalid ranking');
  return ranking.reduce((sum, id, i) => sum + Math.abs(i - ANSWER_IDS.indexOf(id)), 0);
}

const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// members: 개인 순위 배열들, team: 팀 합의 순위, memberCount: 팀 등록 인원,
// spokenCount: 진행자가 확인한 발언 인원(null이면 미평가), minorityAdopted: 소수 의견 채택 여부
export function teamResult({ members, team, memberCount, spokenCount, minorityAdopted }) {
  const T = errorScore(team);
  const indiv = members.map(errorScore);
  const avg = indiv.length ? indiv.reduce((a, b) => a + b, 0) / indiv.length : null;
  const best = indiv.length ? Math.min(...indiv) : null;

  const accuracy = 40 * clamp(1 - T / ERR_CAP, 0, 1);
  let synergy = 0, synergyBase = 0, synergyBonus = 0;
  if (avg !== null) {
    synergyBase = clamp((avg - T) * 1.5, 0, 20);
    synergyBonus = T < best ? 10 : 0;
    synergy = Math.min(30, synergyBase + synergyBonus);
  }
  const evaluated = spokenCount !== null && spokenCount !== undefined;
  const spoken = evaluated ? clamp(spokenCount, 0, memberCount) : 0;
  const speak = evaluated ? Math.max(0, 15 - 3 * (memberCount - spoken)) : 0;
  const minority = minorityAdopted ? 15 : 0;
  const participation = speak + minority;

  return {
    teamError: T, avgIndividualError: avg === null ? null : r1(avg), bestIndividualError: best,
    accuracy: r1(accuracy), synergy: r1(synergy), synergyBonus, speak, minority, participation,
    participationEvaluated: evaluated,
    total: r1(accuracy + synergy + participation),
  };
}

// 내 개인 순위가 팀 합의 순위에 얼마나 담겼는지. 물건별 순위 차이의 합이 0이면 100%, 최대(112)면 0%.
const MAX_DIFF = Math.floor((ITEM_IDS.length * ITEM_IDS.length) / 2);
export function reflection(individual, team) {
  if (!isValidRanking(individual) || !isValidRanking(team)) throw new Error('invalid ranking');
  const rows = individual.map((id, i) => ({ id, mine: i + 1, team: team.indexOf(id) + 1 }));
  rows.forEach((r) => { r.diff = Math.abs(r.mine - r.team); });
  const total = rows.reduce((a, r) => a + r.diff, 0);
  return {
    percent: Math.round(100 * (1 - total / MAX_DIFF)),
    mine1: rows[0],
    matched: rows.filter((r) => r.diff <= 1).sort((a, b) => a.mine - b.mine).slice(0, 3),
    missed: rows.filter((r) => r.diff >= 4).sort((a, b) => b.diff - a.diff || a.mine - b.mine).slice(0, 3),
  };
}
