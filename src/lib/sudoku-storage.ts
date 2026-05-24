/**
 * Sudoku Storage - localStorage persistence layer for game state, stats, and achievements
 */

import type { Difficulty } from './sudoku-engine';

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalTimePlayed: number; // seconds
  fastestTimes: Record<Difficulty, number>;
  averageTimes: Record<Difficulty, number>;
  gamesByDifficulty: Record<Difficulty, number>;
  winsByDifficulty: Record<Difficulty, number>;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
  dailyCompleted: string[];
  totalHintsUsed: number;
  totalMistakes: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
  category: 'solving' | 'speed' | 'streak' | 'mastery';
}

export interface LeaderboardEntry {
  time: number;
  difficulty: Difficulty;
  date: string;
  mistakes: number;
  hintsUsed: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  highlightSameNumbers: boolean;
  autoNotes: boolean;
  soundEnabled: boolean;
  bgMusicEnabled: boolean;
  mistakeLimit: number;
  showTimer: boolean;
  highlightConflicts: boolean;
}

export interface SavedGame {
  board: string; // JSON serialized
  difficulty: Difficulty;
  timer: number;
  mistakes: number;
  hintsUsed: number;
  score: number;
  notesMode: boolean;
  undoStack: string; // JSON serialized
  isDaily: boolean;
  dailyDate: string | null;
  savedAt: string;
}

const STORAGE_KEYS = {
  STATS: 'sudoku-stats',
  ACHIEVEMENTS: 'sudoku-achievements',
  LEADERBOARD: 'sudoku-leaderboard',
  SETTINGS: 'sudoku-settings',
  SAVED_GAME: 'sudoku-saved-game',
  TUTORIAL_SEEN: 'sudoku-tutorial-seen',
  PLAYER_PROGRESS: 'sudoku-player-progress',
} as const;

// ========== DEFAULT VALUES ==========

// Use -1 instead of Infinity for fastestTimes because Infinity
// doesn't survive JSON serialization: JSON.stringify(Infinity) => null
// and null treated as 0 in arithmetic => formatTime(null) => "00:00"
export const NO_TIME = -1;

export function getDefaultStats(): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalTimePlayed: 0,
    fastestTimes: { easy: NO_TIME, medium: NO_TIME, hard: NO_TIME },
    averageTimes: { easy: 0, medium: 0, hard: 0 },
    gamesByDifficulty: { easy: 0, medium: 0, hard: 0 },
    winsByDifficulty: { easy: 0, medium: 0, hard: 0 },
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: '',
    dailyCompleted: [],
    totalHintsUsed: 0,
    totalMistakes: 0,
  };
}

export function getDefaultAchievements(): Achievement[] {
  return [
    { id: 'first-solve', name: 'First Victory', description: 'Complete your first puzzle', icon: '🏆', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'solving' },
    { id: 'no-hints', name: 'No Hints Master', description: 'Complete a puzzle without using hints', icon: '🧠', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'solving' },
    { id: 'no-mistakes', name: 'Perfect Game', description: 'Complete a puzzle with zero mistakes', icon: '💎', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'solving' },
    { id: 'speed-easy', name: 'Speed Demon', description: 'Solve an easy puzzle under 5 minutes', icon: '⚡', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'speed' },
    { id: 'speed-medium', name: 'Quick Thinker', description: 'Solve a medium puzzle under 10 minutes', icon: '🏃', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'speed' },
    { id: 'speed-hard', name: 'Lightning Mind', description: 'Solve a hard puzzle under 20 minutes', icon: '🌪️', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'speed' },
    { id: 'streak-3', name: 'On Fire', description: 'Win 3 games in a row', icon: '🔥', unlocked: false, unlockedAt: null, progress: 0, target: 3, category: 'streak' },
    { id: 'streak-7', name: 'Unstoppable', description: 'Win 7 games in a row', icon: '🚀', unlocked: false, unlockedAt: null, progress: 0, target: 7, category: 'streak' },
    { id: 'streak-30', name: 'Legend', description: 'Win 30 games in a row', icon: '👑', unlocked: false, unlockedAt: null, progress: 0, target: 30, category: 'streak' },
    { id: 'games-10', name: 'Getting Started', description: 'Complete 10 puzzles', icon: '🎯', unlocked: false, unlockedAt: null, progress: 0, target: 10, category: 'mastery' },
    { id: 'games-50', name: 'Dedicated', description: 'Complete 50 puzzles', icon: '📚', unlocked: false, unlockedAt: null, progress: 0, target: 50, category: 'mastery' },
    { id: 'games-100', name: 'Century Club', description: 'Complete 100 puzzles', icon: '💯', unlocked: false, unlockedAt: null, progress: 0, target: 100, category: 'mastery' },
    { id: 'hard-win', name: 'Brave Soul', description: 'Complete a hard puzzle', icon: '🗡️', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'mastery' },
    { id: 'daily-1', name: 'Daily Player', description: 'Complete a daily challenge', icon: '📅', unlocked: false, unlockedAt: null, progress: 0, target: 1, category: 'solving' },
    { id: 'daily-7', name: 'Weekly Warrior', description: 'Complete 7 daily challenges', icon: '🗓️', unlocked: false, unlockedAt: null, progress: 0, target: 7, category: 'mastery' },
    { id: 'all-difficulties', name: 'All-Rounder', description: 'Win on all three difficulties', icon: '🌟', unlocked: false, unlockedAt: null, progress: 0, target: 3, category: 'mastery' },
  ];
}

export function getDefaultSettings(): AppSettings {
  return {
    theme: 'dark',
    highlightSameNumbers: true,
    autoNotes: false,
    soundEnabled: true,
    bgMusicEnabled: true,
    mistakeLimit: 3,
    showTimer: true,
    highlightConflicts: true,
  };
}

// ========== STORAGE FUNCTIONS ==========

function safeGet<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return fallback;
    const parsed = JSON.parse(data) as T;
    // Fix legacy data where Infinity was serialized as null
    if (parsed && typeof parsed === 'object' && 'fastestTimes' in parsed) {
      const stats = parsed as Record<string, unknown>;
      const ft = stats.fastestTimes as Record<string, number | null>;
      for (const diff of ['easy', 'medium', 'hard']) {
        if (ft[diff] === null || ft[diff] === undefined) {
          ft[diff] = NO_TIME;
        }
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

// Stats
export function loadStats(): GameStats {
  return safeGet(STORAGE_KEYS.STATS, getDefaultStats());
}

export function saveStats(stats: GameStats): void {
  safeSet(STORAGE_KEYS.STATS, stats);
}

// Achievements
export function loadAchievements(): Achievement[] {
  return safeGet(STORAGE_KEYS.ACHIEVEMENTS, getDefaultAchievements());
}

export function saveAchievements(achievements: Achievement[]): void {
  safeSet(STORAGE_KEYS.ACHIEVEMENTS, achievements);
}

// Leaderboard
export function loadLeaderboard(): LeaderboardEntry[] {
  return safeGet(STORAGE_KEYS.LEADERBOARD, []);
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  safeSet(STORAGE_KEYS.LEADERBOARD, entries);
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const entries = loadLeaderboard();
  entries.push(entry);
  entries.sort((a, b) => a.time - b.time);
  // Keep top 50 entries
  const trimmed = entries.slice(0, 50);
  saveLeaderboard(trimmed);
  return trimmed;
}

// Settings
export function loadSettings(): AppSettings {
  return safeGet(STORAGE_KEYS.SETTINGS, getDefaultSettings());
}

export function saveSettings(settings: AppSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

// Saved Game
export function loadSavedGame(): SavedGame | null {
  return safeGet<SavedGame | null>(STORAGE_KEYS.SAVED_GAME, null);
}

export function saveGame(game: SavedGame): void {
  safeSet(STORAGE_KEYS.SAVED_GAME, game);
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
  } catch {
    // ignore
  }
}

// Tutorial
export function hasSeenTutorial(): boolean {
  return safeGet(STORAGE_KEYS.TUTORIAL_SEEN, false);
}

export function markTutorialSeen(): void {
  safeSet(STORAGE_KEYS.TUTORIAL_SEEN, true);
}

// ========== LEVEL & PROGRESSION SYSTEM ==========

/** Level configuration */
export interface LevelConfig {
  level: number;
  difficulty: Difficulty;
  cluesToRemove: number; // Number of cells to remove (higher = harder)
  coinsReward: number;   // Coins earned for completing
  continueCost: number;  // Coins to continue after failing
}

/** Player progress */
export interface PlayerProgress {
  currentLevel: number;      // Current level (1-based)
  maxLevelReached: number;   // Highest level ever reached
  coins: number;             // Total coins
  lives: number;             // Current lives (max 6)
  maxLives: number;          // Always 6
  lastLifeLostAt: string | null; // ISO timestamp of last life lost
  completedLevels: number[]; // Array of completed level numbers
  totalCoinsEarned: number;  // Lifetime coins earned
  totalCoinsSpent: number;   // Lifetime coins spent
  hints: number;             // Global hints (shared across all levels, default 5)
  lastDailyHintAt: string | null; // ISO date string (YYYY-MM-DD) of last daily hint claimed
  lastAdHintAt: string | null;    // ISO timestamp of last ad-watched hint (for cooldown)
  totalHintsEarned: number;  // Lifetime hints earned
  totalHintsUsed: number;    // Lifetime hints used
}

/**
 * Dynamically generate level configuration for any level number.
 * Difficulty increases progressively as the player advances.
 * - Levels 1-15: Easy (increasing cluesToRemove)
 * - Levels 16-30: Medium (increasing cluesToRemove)
 * - Levels 31+: Hard (increasing cluesToRemove, capped at 60)
 * Coins reward and continue cost increase with level.
 */
export function getLevelConfig(level: number): LevelConfig {
  if (level < 1) level = 1;

  let difficulty: Difficulty;
  let baseClues: number;
  let coinsReward: number;
  let continueCost: number;

  if (level <= 15) {
    // Easy: cluesToRemove ranges from 36 to 48
    difficulty = 'easy';
    baseClues = 36 + Math.floor((level - 1) * 0.8); // 36 -> ~47
    coinsReward = 10 + Math.floor((level - 1) / 5) * 2; // 10, 12, 15
    continueCost = 5 + Math.floor((level - 1) / 5); // 5, 6, 8
  } else if (level <= 30) {
    // Medium: cluesToRemove ranges from 43 to 53
    difficulty = 'medium';
    const tierLevel = level - 15; // 1-15 within medium
    baseClues = 43 + Math.floor((tierLevel - 1) * 0.7); // 43 -> ~53
    coinsReward = 20 + Math.floor((tierLevel - 1) / 5) * 3; // 20, 22, 25
    continueCost = 10 + Math.floor((tierLevel - 1) / 5) * 2; // 10, 12, 14
  } else {
    // Hard: cluesToRemove ranges from 49 up to 60
    difficulty = 'hard';
    const tierLevel = level - 30; // 1+ within hard
    baseClues = 49 + Math.min(Math.floor((tierLevel - 1) * 0.5), 11); // 49 -> 60 (capped)
    coinsReward = 30 + Math.min(Math.floor((tierLevel - 1) / 5) * 5, 30); // 30 -> up to 60
    continueCost = 16 + Math.min(Math.floor((tierLevel - 1) / 5) * 2, 14); // 16 -> up to 30
  }

  // Clamp cluesToRemove to sane bounds (min 30, max 60)
  baseClues = Math.max(30, Math.min(60, baseClues));

  return {
    level,
    difficulty,
    cluesToRemove: baseClues,
    coinsReward,
    continueCost,
  };
}

/** Get default player progress */
export function getDefaultPlayerProgress(): PlayerProgress {
  return {
    currentLevel: 1,
    maxLevelReached: 1,
    coins: 0,
    lives: 6,
    maxLives: 6,
    lastLifeLostAt: null,
    completedLevels: [],
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    hints: 5,
    lastDailyHintAt: null,
    lastAdHintAt: null,
    totalHintsEarned: 5,
    totalHintsUsed: 0,
  };
}

/** Load player progress from localStorage (with migration for new fields) */
export function loadPlayerProgress(): PlayerProgress {
  const defaults = getDefaultPlayerProgress();
  const loaded = safeGet<Record<string, unknown>>(STORAGE_KEYS.PLAYER_PROGRESS, {});

  // If empty or invalid, return defaults
  if (!loaded || Object.keys(loaded).length === 0) return defaults;

  // Merge with defaults to ensure new fields (hints, etc.) are populated for existing users
  return {
    ...defaults,
    ...loaded,
    // Ensure new fields exist even for legacy data
    hints: typeof loaded.hints === 'number' ? loaded.hints : defaults.hints,
    lastDailyHintAt: typeof loaded.lastDailyHintAt === 'string' ? loaded.lastDailyHintAt : defaults.lastDailyHintAt,
    lastAdHintAt: typeof loaded.lastAdHintAt === 'string' ? loaded.lastAdHintAt : defaults.lastAdHintAt,
    totalHintsEarned: typeof loaded.totalHintsEarned === 'number' ? loaded.totalHintsEarned : defaults.totalHintsEarned,
    totalHintsUsed: typeof loaded.totalHintsUsed === 'number' ? loaded.totalHintsUsed : defaults.totalHintsUsed,
  } as PlayerProgress;
}

/**
 * Check if the player is eligible for a daily hint reward.
 * Daily hint can be claimed once per calendar day.
 */
export function canClaimDailyHint(lastDailyHintAt: string | null): boolean {
  if (!lastDailyHintAt) return true;
  const today = getTodayString();
  return lastDailyHintAt !== today;
}

/**
 * Check if the player can watch an ad for a hint (cooldown: 2 minutes).
 */
export function canWatchAdForHint(lastAdHintAt: string | null): boolean {
  if (!lastAdHintAt) return true;
  const lastAd = new Date(lastAdHintAt).getTime();
  const now = Date.now();
  const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown
  return (now - lastAd) >= COOLDOWN_MS;
}

/** Save player progress to localStorage */
export function savePlayerProgress(progress: PlayerProgress): void {
  safeSet(STORAGE_KEYS.PLAYER_PROGRESS, progress);
}

/**
 * Calculate how many lives should have regenerated since lastLifeLostAt.
 * Lives regenerate at 1 per 30 minutes.
 * @returns livesToAdd and the timestamp when the next life will regenerate
 */
export function calculateLivesToRegenerate(
  lastLifeLostAt: string | null,
  currentLives: number,
  maxLives: number
): { livesToAdd: number; nextRegenAt: Date | null } {
  // Already at max lives, no regeneration needed
  if (currentLives >= maxLives) {
    return { livesToAdd: 0, nextRegenAt: null };
  }

  // No record of losing a life, can't calculate regeneration
  if (!lastLifeLostAt) {
    return { livesToAdd: 0, nextRegenAt: null };
  }

  const lostAt = new Date(lastLifeLostAt).getTime();
  const now = Date.now();
  const elapsed = now - lostAt;

  const REGEN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes in ms
  const livesToRegen = Math.floor(elapsed / REGEN_INTERVAL_MS);

  // Cap at max lives
  const livesToAdd = Math.min(livesToRegen, maxLives - currentLives);

  if (livesToAdd > 0) {
    // Calculate when the NEXT life after the ones being added will regenerate
    const nextRegenElapsed = (livesToRegen + 1) * REGEN_INTERVAL_MS;
    const nextRegenAt = new Date(lostAt + nextRegenElapsed);
    return { livesToAdd, nextRegenAt };
  }

  // No lives to add yet, calculate when the first one will regen
  const nextRegenAt = new Date(lostAt + REGEN_INTERVAL_MS);
  return { livesToAdd: 0, nextRegenAt };
}

// ========== ACHIEVEMENT CHECKING ==========

export interface GameResult {
  won: boolean;
  difficulty: Difficulty;
  time: number;
  mistakes: number;
  hintsUsed: number;
  isDaily: boolean;
}

export function checkAchievements(stats: GameStats, result: GameResult): Achievement[] {
  const achievements = loadAchievements();
  const now = new Date().toISOString();

  const unlock = (id: string) => {
    const a = achievements.find(x => x.id === id);
    if (a && !a.unlocked) {
      a.unlocked = true;
      a.unlockedAt = now;
    }
  };

  const updateProgress = (id: string, progress: number) => {
    const a = achievements.find(x => x.id === id);
    if (a) {
      a.progress = progress;
      if (progress >= a.target && !a.unlocked) {
        a.unlocked = true;
        a.unlockedAt = now;
      }
    }
  };

  if (result.won) {
    unlock('first-solve');
    if (result.hintsUsed === 0) unlock('no-hints');
    if (result.mistakes === 0) unlock('no-mistakes');
    if (result.difficulty === 'easy' && result.time < 300) unlock('speed-easy');
    if (result.difficulty === 'medium' && result.time < 600) unlock('speed-medium');
    if (result.difficulty === 'hard' && result.time < 1200) unlock('speed-hard');
    if (result.difficulty === 'hard') unlock('hard-win');
    if (result.isDaily) unlock('daily-1');

    updateProgress('streak-3', stats.currentStreak);
    updateProgress('streak-7', stats.currentStreak);
    updateProgress('streak-30', stats.currentStreak);
    updateProgress('games-10', stats.gamesWon);
    updateProgress('games-50', stats.gamesWon);
    updateProgress('games-100', stats.gamesWon);
    updateProgress('daily-7', stats.dailyCompleted.length);

    // All difficulties
    const diffWon = (stats.winsByDifficulty.easy > 0 ? 1 : 0) +
                    (stats.winsByDifficulty.medium > 0 ? 1 : 0) +
                    (stats.winsByDifficulty.hard > 0 ? 1 : 0);
    updateProgress('all-difficulties', diffWon);
  }

  saveAchievements(achievements);
  return achievements;
}

/** Update statistics after a game */
export function updateStats(stats: GameStats, result: GameResult): GameStats {
  const newStats = { ...stats };
  newStats.gamesPlayed++;
  newStats.gamesByDifficulty[result.difficulty]++;
  newStats.totalTimePlayed += result.time;
  newStats.totalHintsUsed += result.hintsUsed;
  newStats.totalMistakes += result.mistakes;
  newStats.lastPlayedDate = new Date().toISOString().split('T')[0];

  if (result.won) {
    newStats.gamesWon++;
    newStats.winsByDifficulty[result.difficulty]++;

    // Fastest time (NO_TIME = -1 means no previous time, so any win is a new best)
    if (newStats.fastestTimes[result.difficulty] === NO_TIME || result.time < newStats.fastestTimes[result.difficulty]) {
      newStats.fastestTimes[result.difficulty] = result.time;
    }

    // Average time
    const totalTime = (newStats.averageTimes[result.difficulty] * (newStats.winsByDifficulty[result.difficulty] - 1)) + result.time;
    newStats.averageTimes[result.difficulty] = Math.round(totalTime / newStats.winsByDifficulty[result.difficulty]);

    // Streak
    newStats.currentStreak++;
    if (newStats.currentStreak > newStats.bestStreak) {
      newStats.bestStreak = newStats.currentStreak;
    }

    // Daily
    if (result.isDaily) {
      const today = new Date().toISOString().split('T')[0];
      if (!newStats.dailyCompleted.includes(today)) {
        newStats.dailyCompleted.push(today);
      }
    }
  } else {
    newStats.currentStreak = 0;
  }

  saveStats(newStats);
  return newStats;
}

/** Get today's date string */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/** Format seconds to MM:SS, returns '--:--' for no time set */
export function formatTime(seconds: number): string {
  if (seconds === NO_TIME || seconds < 0 || seconds === null || seconds === undefined) {
    return '--:--';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
