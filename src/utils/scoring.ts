import { ScoreBreakdown } from '../types';

/**
 * Calculate score for a vote
 *
 * Scoring system:
 * - 1 point for correct answer
 */
export const calculateScore = (
  isCorrect: boolean,
  _responseTimeMs?: number,
  _maxTimeMs?: number,
  _currentStreak?: number
): ScoreBreakdown => {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      total: 0,
    };
  }

  return {
    basePoints: 1,
    speedBonus: 0,
    streakBonus: 0,
    total: 1,
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
