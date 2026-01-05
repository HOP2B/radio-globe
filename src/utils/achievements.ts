export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserStats {
  points: number;
  totalGuesses: number;
  correctGuesses: number;
  streakRecord: number;
  favoriteCountry: string;
  joinDate: string;
}

export interface UserAchievement {
  id: string;
  unlockedAt: Date;
  progress?: number; // For progress-based achievements
}

// Define all achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_guess",
    name: "First Guess",
    description: "Make your first country guess",
    icon: "🎈",
    condition: (stats) => stats.totalGuesses >= 1,
    rarity: "common",
  },
  {
    id: "correct_guess",
    name: "Getting Started",
    description: "Get your first correct guess",
    icon: "✅",
    condition: (stats) => stats.correctGuesses >= 1,
    rarity: "common",
  },
  {
    id: "ten_correct",
    name: "Apprentice Guesser",
    description: "Get 10 correct guesses",
    icon: "🎯",
    condition: (stats) => stats.correctGuesses >= 10,
    rarity: "common",
  },
  {
    id: "fifty_correct",
    name: "Expert Guesser",
    description: "Get 50 correct guesses",
    icon: "🏹",
    condition: (stats) => stats.correctGuesses >= 50,
    rarity: "rare",
  },
  {
    id: "hundred_correct",
    name: "Master Guesser",
    description: "Get 100 correct guesses",
    icon: "🎖️",
    condition: (stats) => stats.correctGuesses >= 100,
    rarity: "epic",
  },
  {
    id: "streak_5",
    name: "Hot Streak",
    description: "Achieve a 5-guess streak",
    icon: "🔥",
    condition: (stats) => stats.streakRecord >= 5,
    rarity: "common",
  },
  {
    id: "streak_10",
    name: "On Fire",
    description: "Achieve a 10-guess streak",
    icon: "🔥🔥",
    condition: (stats) => stats.streakRecord >= 10,
    rarity: "rare",
  },
  {
    id: "streak_20",
    name: "Unstoppable",
    description: "Achieve a 20-guess streak",
    icon: "🔥🔥🔥",
    condition: (stats) => stats.streakRecord >= 20,
    rarity: "epic",
  },
  {
    id: "points_100",
    name: "Century Club",
    description: "Earn 100 points",
    icon: "💯",
    condition: (stats) => stats.points >= 100,
    rarity: "common",
  },
  {
    id: "points_500",
    name: "High Scorer",
    description: "Earn 500 points",
    icon: "⭐",
    condition: (stats) => stats.points >= 500,
    rarity: "rare",
  },
  {
    id: "points_1000",
    name: "Point Master",
    description: "Earn 1000 points",
    icon: "🌟",
    condition: (stats) => stats.points >= 1000,
    rarity: "epic",
  },
  {
    id: "accuracy_80",
    name: "Sharp Mind",
    description: "Achieve 80% accuracy",
    icon: "🧠",
    condition: (stats) =>
      stats.totalGuesses >= 10 &&
      stats.correctGuesses / stats.totalGuesses >= 0.8,
    rarity: "rare",
  },
  {
    id: "accuracy_90",
    name: "Eagle Eye",
    description: "Achieve 90% accuracy",
    icon: "👁️",
    condition: (stats) =>
      stats.totalGuesses >= 20 &&
      stats.correctGuesses / stats.totalGuesses >= 0.9,
    rarity: "epic",
  },
  {
    id: "explorer",
    name: "World Explorer",
    description: "Guess countries from 10 different nations",
    icon: "🌍",
    condition: (stats) => stats.correctGuesses >= 10, // Simplified - would need to track unique countries
    rarity: "rare",
  },
  {
    id: "legendary_guesser",
    name: "Legendary Guesser",
    description: "Get 500 correct guesses",
    icon: "👑",
    condition: (stats) => stats.correctGuesses >= 500,
    rarity: "legendary",
  },
];

// Helper functions
export function getUnlockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.condition(stats));
}

export function getAchievementRarityColor(
  rarity: Achievement["rarity"]
): string {
  switch (rarity) {
    case "common":
      return "#6b7280";
    case "rare":
      return "#3b82f6";
    case "epic":
      return "#8b5cf6";
    case "legendary":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

export function getAchievementProgress(
  achievement: Achievement,
  stats: UserStats
): number {
  // For now, return 0 or 100 based on condition
  // Could be extended for progress-based achievements
  return achievement.condition(stats) ? 100 : 0;
}
