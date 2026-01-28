import { ScoreBreakdown, ScoringMode } from '../types';

/**
 * Calculate score for a vote
 *
 * Simple mode: +1 for correct, 0 for wrong
 * Speed mode: 10 base + up to 5 speed bonus + up to 10 streak bonus
 */
export const calculateScore = (
  isCorrect: boolean,
  responseTimeMs?: number,
  maxTimeMs?: number,
  currentStreak?: number,
  scoringMode: ScoringMode = 'simple'
): ScoreBreakdown => {
  if (!isCorrect) {
    return { basePoints: 0, speedBonus: 0, streakBonus: 0, total: 0 };
  }

  if (scoringMode === 'simple') {
    return { basePoints: 1, speedBonus: 0, streakBonus: 0, total: 1 };
  }

  // Speed mode
  const basePoints = 10;

  // Speed bonus: linear from 5 (instant) to 0 (at max time)
  let speedBonus = 0;
  if (responseTimeMs != null && maxTimeMs && maxTimeMs > 0) {
    const ratio = Math.max(0, 1 - responseTimeMs / (maxTimeMs * 1000));
    speedBonus = Math.round(ratio * 5);
  }

  // Streak bonus: +2 per streak level, capped at +10
  const streak = currentStreak ?? 0;
  const streakBonus = Math.min(streak * 2, 10);

  return {
    basePoints,
    speedBonus,
    streakBonus,
    total: basePoints + speedBonus + streakBonus,
  };
};

/**
 * Decode HTML entities in a string
 */
export const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#47;': '/',
    '&nbsp;': ' ',
  };

  return text.replace(/&[#\w]+;/g, (match) => entities[match] || match);
};

/**
 * Format score with animation-friendly breakdown
 */
export const formatScoreBreakdown = (breakdown: ScoreBreakdown): string[] => {
  const parts: string[] = [];

  if (breakdown.basePoints > 0) {
    parts.push(`+${breakdown.basePoints} Poprawna!`);
  }

  if (breakdown.speedBonus > 0) {
    parts.push(`+${breakdown.speedBonus} Bonus za szybkość`);
  }

  if (breakdown.streakBonus > 0) {
    parts.push(`+${breakdown.streakBonus} Bonus za serię`);
  }

  return parts;
};

/**
 * Get ranking position suffix (1st, 2nd, 3rd, etc.)
 */
export const getPositionSuffix = (position: number): string => {
  return `${position}.`;
};

/**
 * Sort players by score (descending), then by avg response time (ascending) as tiebreaker
 * Returns with rankings (tied players share same rank)
 */
export const getRankedPlayers = <T extends { score: number; avgResponseTime?: number }>(
  players: T[]
): (T & { rank: number })[] => {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreaker: faster average response time wins
    const aTime = a.avgResponseTime ?? Infinity;
    const bTime = b.avgResponseTime ?? Infinity;
    return aTime - bTime;
  });

  let currentRank = 1;
  let lastScore = -1;
  let lastTime = -1;

  return sorted.map((player, index) => {
    const time = player.avgResponseTime ?? Infinity;
    if (player.score !== lastScore || time !== lastTime) {
      currentRank = index + 1;
      lastScore = player.score;
      lastTime = time;
    }

    return {
      ...player,
      rank: currentRank,
    };
  });
};
