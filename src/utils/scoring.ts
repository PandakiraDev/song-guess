import { ScoreBreakdown } from '../types';

/**
 * Calculate score for a vote
 *
 * Scoring system:
 * - Base points: 1 point for correct answer
 * - Speed bonus: 0-3 points based on response time
 *   - First 25% of time: +3 points
 *   - 25-50% of time: +2 points
 *   - 50-75% of time: +1 point
 *   - 75-100% of time: +0 points
 * - Streak bonus: +1 point for each consecutive correct answer
 */
export const calculateScore = (
  isCorrect: boolean,
  responseTimeMs: number,
  maxTimeMs: number,
  currentStreak: number
): ScoreBreakdown => {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      total: 0,
    };
  }

  const basePoints = 1;

  // Calculate speed bonus
  const timeRatio = responseTimeMs / maxTimeMs;
  let speedBonus = 0;

  if (timeRatio <= 0.25) {
    speedBonus = 3;
  } else if (timeRatio <= 0.5) {
    speedBonus = 2;
  } else if (timeRatio <= 0.75) {
    speedBonus = 1;
  }

  // Streak bonus: +1 for each consecutive correct (excluding current)
  // currentStreak includes the current correct answer
  const streakBonus = Math.max(0, currentStreak - 1);

  return {
    basePoints,
    speedBonus,
    streakBonus,
    total: basePoints + speedBonus + streakBonus,
  };
};

/**
 * Get speed bonus description
 */
export const getSpeedBonusText = (responseTimeMs: number, maxTimeMs: number): string => {
  const timeRatio = responseTimeMs / maxTimeMs;

  if (timeRatio <= 0.25) {
    return 'Lightning fast! +3';
  } else if (timeRatio <= 0.5) {
    return 'Quick! +2';
  } else if (timeRatio <= 0.75) {
    return 'Nice! +1';
  }

  return '';
};

/**
 * Get streak description
 */
export const getStreakText = (streak: number): string => {
  if (streak >= 5) {
    return `On fire! ${streak} in a row!`;
  } else if (streak >= 3) {
    return `Hot streak! ${streak} in a row!`;
  } else if (streak >= 2) {
    return `${streak} in a row!`;
  }

  return '';
};

/**
 * Format score with animation-friendly breakdown
 */
export const formatScoreBreakdown = (breakdown: ScoreBreakdown): string[] => {
  const parts: string[] = [];

  if (breakdown.basePoints > 0) {
    parts.push(`+${breakdown.basePoints} Correct!`);
  }

  if (breakdown.speedBonus > 0) {
    parts.push(`+${breakdown.speedBonus} Speed bonus`);
  }

  if (breakdown.streakBonus > 0) {
    parts.push(`+${breakdown.streakBonus} Streak bonus`);
  }

  return parts;
};

/**
 * Get ranking position suffix (1st, 2nd, 3rd, etc.)
 */
export const getPositionSuffix = (position: number): string => {
  if (position === 1) return '1st';
  if (position === 2) return '2nd';
  if (position === 3) return '3rd';
  return `${position}th`;
};

/**
 * Sort players by score (descending) and return with rankings
 */
export const getRankedPlayers = <T extends { score: number }>(
  players: T[]
): (T & { rank: number })[] => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  let currentRank = 1;
  let lastScore = -1;

  return sorted.map((player, index) => {
    if (player.score !== lastScore) {
      currentRank = index + 1;
      lastScore = player.score;
    }

    return {
      ...player,
      rank: currentRank,
    };
  });
};
