/**
 * Sudoku Game Store - Zustand state management
 */

import { create } from 'zustand';
import {
  type BoardState,
  type Difficulty,
  type UndoAction,
  generatePuzzle,
  getDailySeed,
  updateErrors,
  updateErrorsMutate,
  updateErrorsIncremental,
  isPuzzleSolved,
  findConflicts,
  getHint,
  autoFillNotes,
  solveBoard,
  cloneBoard,
  countNumbers,
} from './sudoku-engine';
import {
  type GameStats,
  type Achievement,
  type LeaderboardEntry,
  type AppSettings,
  type GameResult,
  type PlayerProgress,
  type LevelConfig,
  loadStats,
  saveStats,
  updateStats,
  loadAchievements,
  checkAchievements,
  loadLeaderboard,
  addLeaderboardEntry,
  loadSettings,
  saveSettings,
  loadSavedGame,
  saveGame,
  clearSavedGame,
  hasSeenTutorial,
  markTutorialSeen,
  getTodayString,
  getDefaultStats,
  getDefaultSettings,
  getDefaultAchievements,
  NO_TIME,
  getLevelConfig,
  getDefaultPlayerProgress,
  loadPlayerProgress,
  savePlayerProgress,
  calculateLivesToRegenerate,
  canClaimDailyHint,
  canWatchAdForHint,
} from './sudoku-storage';
import {
  playPlaceSound,
  playSelectSound,
  playErrorSound,
  playEraseSound,
  playNotesToggleSound,
  playHintSound,
  playUndoSound,
  playWinSound,
  playGameOverSound,
  playNumberCompleteSound,
  initAudio,
} from './sudoku-sounds';
import { getSupabase, isSupabaseConfigured } from './supabase';

// ========== TYPES ==========

export type Screen = 'home' | 'game' | 'achievements' | 'leaderboard' | 'statistics' | 'settings' | 'auth' | 'levelMap';

export interface SudokuState {
  // Navigation
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  screenHistory: Screen[];
  goBack: () => void;
  showExitConfirm: boolean;
  dismissExitConfirm: () => void;
  confirmExit: () => void;

  // Game State
  board: BoardState;
  difficulty: Difficulty;
  selectedCell: [number, number] | null;
  notesMode: boolean;
  timer: number;
  isRunning: boolean;
  mistakes: number;
  hintsUsed: number;
  score: number;
  isComplete: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  undoStack: UndoAction[];
  isDaily: boolean;
  dailyDate: string | null;
  isNewBest: boolean;

  // Game Actions
  startNewGame: (difficulty: Difficulty, isDaily?: boolean) => void;
  resumeGame: () => void;
  selectCell: (row: number, col: number) => void;
  enterNumber: (num: number) => void;
  eraseCell: () => void;
  toggleNotesMode: () => void;
  useHint: () => void;
  undo: () => void;
  pauseGame: () => void;
  resumeGameTimer: () => void;
  tickTimer: () => void;
  giveUp: () => void;
  cheatSolve: () => void;

  // Persisted Data
  stats: GameStats;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  settings: AppSettings;
  tutorialSeen: boolean;

  // Settings Actions
  updateSettings: (partial: Partial<AppSettings>) => void;
  markTutorialComplete: () => void;

  // Selected number (for highlighting same numbers)
  selectedNumber: number | null;

  // Loading state
  isGenerating: boolean;

  // Confetti
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;

  // Auto-fill notes action
  doAutoFillNotes: () => void;

  // Quick Game mode
  isQuickGame: boolean;
  quickGameDifficulty: Difficulty | null;

  // Level / Progress
  currentLevel: number;
  playerProgress: PlayerProgress;
  showLevelComplete: boolean;
  showLevelFail: boolean;

  // Level actions
  startLevel: (level: number) => void;
  startNextLevel: () => void;
  startQuickGame: (difficulty: Difficulty) => void;
  continueWithCoins: () => void;
  restartLevel: () => void;
  recoverLife: () => void;
  regenerateLives: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  dismissLevelComplete: () => void;
  dismissLevelFail: () => void;

  // Hints actions
  addHints: (amount: number) => void;
  claimDailyHint: () => boolean;
  earnHintFromAd: () => boolean;
  getHintsRemaining: () => number;

  // Auth
  user: { id: string; email: string } | null;
  isAuthLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, phone?: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Initialize
  initialize: () => void;
}

// ========== STORE ==========

// The store instance will be exposed on window.__sudokuStore after creation
// (see bottom of this file) so the native Android back-press handler can
// access currentScreen and goBack() via window.__sudokuStore.

export const useSudokuStore = create<SudokuState>((set, get) => ({
  // Navigation
  currentScreen: 'home',
  screenHistory: [] as Screen[],
  showExitConfirm: false,
  setScreen: (screen) => {
    const state = get();
    if (state.currentScreen !== screen) {
      set({ currentScreen: screen, screenHistory: [...state.screenHistory, state.currentScreen] });
    }
  },
  goBack: () => {
    const state = get();
    if (state.screenHistory.length > 0) {
      const previousScreen = state.screenHistory[state.screenHistory.length - 1];
      set({
        currentScreen: previousScreen,
        screenHistory: state.screenHistory.slice(0, -1),
      });
    } else if (state.currentScreen === 'home') {
      set({ showExitConfirm: true });
    } else {
      set({ currentScreen: 'home', screenHistory: [] });
    }
  },
  dismissExitConfirm: () => set({ showExitConfirm: false }),
  confirmExit: () => {
    set({ showExitConfirm: false });
    try {
      if ((window as any).Capacitor?.Plugins?.App) {
        (window as any).Capacitor.Plugins.App.exitApp();
      } else if (window.close) {
        window.close();
      } else {
        window.location.href = 'about:blank';
      }
    } catch {
      window.location.href = 'about:blank';
    }
  },

  // Game State
  board: [],
  difficulty: 'easy',
  selectedCell: null,
  notesMode: false,
  timer: 0,
  isRunning: false,
  mistakes: 0,
  hintsUsed: 0,
  score: 0,
  isComplete: false,
  isPaused: false,
  isGameOver: false,
  undoStack: [],
  isDaily: false,
  dailyDate: null,
  isNewBest: false,
  isGenerating: false,
  showConfetti: false,
  selectedNumber: null,

  // Persisted Data - defaults (populated from localStorage on initialize)
  stats: getDefaultStats(),
  achievements: getDefaultAchievements(),
  leaderboard: [],
  settings: getDefaultSettings(),
  tutorialSeen: false,

  // Quick Game defaults
  isQuickGame: false,
  quickGameDifficulty: null,

  // Level / Progress defaults
  currentLevel: 0,
  playerProgress: getDefaultPlayerProgress(),
  showLevelComplete: false,
  showLevelFail: false,

  // Auth defaults
  user: null,
  isAuthLoading: false,

  setShowConfetti: (show) => set({ showConfetti: show }),

  // Auth: Sign in with email/password
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Cloud sync is not configured. Auth requires server configuration.');
    }
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Cloud sync is not configured.');
    }

    set({ isAuthLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        set({
          user: { id: data.user.id, email: data.user.email ?? email },
          isAuthLoading: false,
        });
      }
    } catch (err) {
      set({ isAuthLoading: false });
      throw err;
    }
  },

  // Auth: Sign up with email/password
  signUp: async (email: string, password: string, phone?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Cloud sync is not configured. Auth requires server configuration.');
    }
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Cloud sync is not configured.');
    }

    set({ isAuthLoading: true });
    try {
      const signUpParams: { email: string; password: string; phone?: string } = { email, password };
      if (phone) signUpParams.phone = phone;

      const { data, error } = await supabase.auth.signUp(signUpParams);
      if (error) throw error;

      if (data.user) {
        set({
          user: { id: data.user.id, email: data.user.email ?? email },
          isAuthLoading: false,
        });
      } else {
        set({ isAuthLoading: false });
      }
    } catch (err) {
      set({ isAuthLoading: false });
      throw err;
    }
  },

  // Auth: Sign in with OAuth provider
  signInWithProvider: async (provider: 'google' | 'facebook') => {
    if (!isSupabaseConfigured()) {
      throw new Error('Cloud sync is not configured. Auth requires server configuration.');
    }
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Cloud sync is not configured.');
    }

    set({ isAuthLoading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
      // OAuth redirects, so loading state will be resolved when user returns
    } catch (err) {
      set({ isAuthLoading: false });
      throw err;
    }
  },

  // Auth: Sign out
  signOut: async () => {
    const supabase = getSupabase();
    if (!supabase) {
      set({ user: null });
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Sign out locally even if server fails
    }
    set({ user: null });
  },

  // Auth: Check current session
  checkAuth: async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        set({
          user: {
            id: data.session.user.id,
            email: data.session.user.email ?? '',
          },
        });
      }
    } catch {
      // Session check failed silently
    }
  },

  // Initialize app from localStorage
  initialize: () => {
    const stats = loadStats();
    const achievements = loadAchievements();
    const leaderboard = loadLeaderboard();
    const settings = loadSettings();
    const tutorialSeen = hasSeenTutorial();
    const playerProgress = loadPlayerProgress();

    // Check if there's a saved game
    const saved = loadSavedGame();
    if (saved) {
      try {
        const board = JSON.parse(saved.board) as BoardState;
        const undoStack = JSON.parse(saved.undoStack) as UndoAction[];
        set({
          board,
          difficulty: saved.difficulty,
          timer: saved.timer,
          mistakes: saved.mistakes,
          hintsUsed: saved.hintsUsed,
          score: saved.score,
          notesMode: saved.notesMode,
          undoStack,
          isDaily: saved.isDaily,
          dailyDate: saved.dailyDate,
          stats,
          achievements,
          leaderboard,
          settings,
          tutorialSeen,
          playerProgress,
        });
      } catch {
        // Corrupted save, ignore
        set({ stats, achievements, leaderboard, settings, tutorialSeen, playerProgress });
      }
    } else {
      set({ stats, achievements, leaderboard, settings, tutorialSeen, playerProgress });
    }

    // Regenerate lives on init
    get().regenerateLives();

    // Check auth session on init
    get().checkAuth();
  },

  // Start a new game (classic mode)
  startNewGame: (difficulty, isDaily = false) => {
    // Initialize audio context on user gesture
    initAudio();
    set({ isGenerating: true });

    // Use requestAnimationFrame to let the UI update before heavy computation
    requestAnimationFrame(() => {
      const seed = isDaily ? getDailySeed(new Date()) : undefined;
      const board = generatePuzzle(difficulty, seed);
      // Update errors in-place (freshly generated board, no need to clone again)
      updateErrorsMutate(board);

      set({
        board,
        difficulty,
        selectedCell: null,
        notesMode: false,
        timer: 0,
        isRunning: true,
        mistakes: 0,
        hintsUsed: 0,
        score: 0,
        isComplete: false,
        isPaused: false,
        isGameOver: false,
        undoStack: [],
        isDaily,
        dailyDate: isDaily ? getTodayString() : null,
        isNewBest: false,
        isGenerating: false,
        currentScreen: 'game',
        selectedNumber: null,
        showConfetti: false,
        currentLevel: 0, // Not a level game
        isQuickGame: false,
        quickGameDifficulty: null,
        showLevelComplete: false,
        showLevelFail: false,
        screenHistory: [...get().screenHistory, get().currentScreen],
      });

      // Clear any previous saved game
      clearSavedGame();
    });
  },

  // Start a level-based game
  startLevel: (level: number) => {
    initAudio();
    set({ isGenerating: true });

    requestAnimationFrame(() => {
      const config = getLevelConfig(level);
      const board = generatePuzzle(config.difficulty, undefined, config.cluesToRemove);
      // Update errors in-place (freshly generated board, no need to clone again)
      updateErrorsMutate(board);

      set({
        board,
        difficulty: config.difficulty,
        selectedCell: null,
        notesMode: false,
        timer: 0,
        isRunning: true,
        mistakes: 0,
        hintsUsed: 0,
        score: 0,
        isComplete: false,
        isPaused: false,
        isGameOver: false,
        undoStack: [],
        isDaily: false,
        dailyDate: null,
        isNewBest: false,
        isGenerating: false,
        currentScreen: 'game',
        selectedNumber: null,
        showConfetti: false,
        currentLevel: level,
        isQuickGame: false,
        quickGameDifficulty: null,
        showLevelComplete: false,
        showLevelFail: false,
        settings: { ...get().settings, mistakeLimit: 5 },
        screenHistory: [...get().screenHistory, get().currentScreen],
      });

      // Update player progress current level
      const progress = get().playerProgress;
      const updatedProgress = {
        ...progress,
        currentLevel: level,
        maxLevelReached: Math.max(progress.maxLevelReached, level),
      };
      savePlayerProgress(updatedProgress);
      set({ playerProgress: updatedProgress });

      // Clear any previous saved game
      clearSavedGame();
    });
  },

  // Start the next level (infinite levels)
  startNextLevel: () => {
    const state = get();
    const nextLevel = state.currentLevel + 1;
    state.startLevel(nextLevel);
  },

  // Start a Quick Game (independent of campaign)
  startQuickGame: (difficulty: Difficulty) => {
    initAudio();
    set({ isGenerating: true });

    requestAnimationFrame(() => {
      const board = generatePuzzle(difficulty);
      // Update errors in-place (freshly generated board, no need to clone again)
      updateErrorsMutate(board);

      set({
        board,
        difficulty,
        selectedCell: null,
        notesMode: false,
        timer: 0,
        isRunning: true,
        mistakes: 0,
        hintsUsed: 0,
        score: 0,
        isComplete: false,
        isPaused: false,
        isGameOver: false,
        undoStack: [],
        isDaily: false,
        dailyDate: null,
        isNewBest: false,
        isGenerating: false,
        currentScreen: 'game',
        selectedNumber: null,
        showConfetti: false,
        currentLevel: 0, // Not a level game
        isQuickGame: true,
        quickGameDifficulty: difficulty,
        showLevelComplete: false,
        showLevelFail: false,
        screenHistory: [...get().screenHistory, get().currentScreen],
      });

      // Clear any previous saved game
      clearSavedGame();
    });
  },

  // Continue after failing with coins
  continueWithCoins: () => {
    const state = get();
    if (state.currentLevel === 0) return; // Not a level game

    const config = getLevelConfig(state.currentLevel);
    const progress = state.playerProgress;

    if (progress.coins < config.continueCost) return; // Not enough coins

    // Spend coins
    const newProgress = {
      ...progress,
      coins: progress.coins - config.continueCost,
      totalCoinsSpent: progress.totalCoinsSpent + config.continueCost,
    };
    savePlayerProgress(newProgress);

    // Erase mistake cells (cells where value !== 0 && value !== solution && !isGiven)
    const newBoard = cloneBoard(state.board);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = newBoard[r][c];
        if (cell.value !== 0 && !cell.isGiven && cell.value !== cell.solution) {
          newBoard[r][c] = {
            ...cell,
            value: 0,
            isError: false,
            notes: Array(9).fill(false),
          };
        }
      }
    }

    // Update errors in-place (board is already a fresh clone)
    updateErrorsMutate(newBoard);

    set({
      board: newBoard,
      mistakes: 0,
      isGameOver: false,
      isRunning: true,
      showLevelFail: false,
      playerProgress: newProgress,
    });
  },

  // Restart the current level (life already lost)
  restartLevel: () => {
    const state = get();
    if (state.currentLevel === 0) return;
    state.startLevel(state.currentLevel);
  },

  // Recover a life (simulates watching an ad)
  recoverLife: () => {
    const state = get();
    const progress = state.playerProgress;
    if (progress.lives >= progress.maxLives) return; // Already at max

    const newProgress = {
      ...progress,
      lives: Math.min(progress.lives + 1, progress.maxLives),
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
  },

  // Regenerate lives based on timer
  regenerateLives: () => {
    const state = get();
    const progress = state.playerProgress;

    const { livesToAdd } = calculateLivesToRegenerate(
      progress.lastLifeLostAt,
      progress.lives,
      progress.maxLives
    );

    if (livesToAdd > 0) {
      const newLives = Math.min(progress.lives + livesToAdd, progress.maxLives);
      // If fully regenerated, clear lastLifeLostAt
      const newLastLifeLostAt = newLives >= progress.maxLives ? null : progress.lastLifeLostAt;

      const newProgress = {
        ...progress,
        lives: newLives,
        lastLifeLostAt: newLastLifeLostAt,
      };
      savePlayerProgress(newProgress);
      set({ playerProgress: newProgress });
    }
  },

  // Add coins
  addCoins: (amount: number) => {
    const state = get();
    const progress = state.playerProgress;
    const newProgress = {
      ...progress,
      coins: progress.coins + amount,
      totalCoinsEarned: progress.totalCoinsEarned + amount,
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
  },

  // Spend coins, returns false if not enough
  spendCoins: (amount: number): boolean => {
    const state = get();
    const progress = state.playerProgress;

    if (progress.coins < amount) return false;

    const newProgress = {
      ...progress,
      coins: progress.coins - amount,
      totalCoinsSpent: progress.totalCoinsSpent + amount,
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
    return true;
  },

  // Dismiss level complete dialog
  dismissLevelComplete: () => {
    set({ showLevelComplete: false });
  },

  // Dismiss level fail dialog
  dismissLevelFail: () => {
    set({ showLevelFail: false });
  },

  // Resume a saved game
  resumeGame: () => {
    set({ currentScreen: 'game', isRunning: true });
  },

  // Select a cell
  selectCell: (row, col) => {
    const state = get();
    if (state.isComplete || state.isPaused || state.isGameOver) return;

    const cellValue = state.board[row]?.[col]?.value ?? 0;
    set({
      selectedCell: [row, col],
      selectedNumber: cellValue > 0 ? cellValue : null,
    });

    // Defer sound playback to after render, preventing an AudioContext
    // node creation from blocking the main thread during touch. On mobile
    // WebViews, synchronous AudioContext operations during a touch handler
    // can add 50-100ms of input latency, perceived as tap lag.
    if (state.settings.soundEnabled) {
      requestAnimationFrame(() => playSelectSound());
    }
  },

  // Enter a number
  enterNumber: (num) => {
    const state = get();
    if (!state.selectedCell || state.isComplete || state.isPaused || state.isGameOver) return;

    const [row, col] = state.selectedCell;
    const cell = state.board[row][col];

    // Can't modify given cells
    if (cell.isGiven) return;

    const newBoard = cloneBoard(state.board);
    const newUndoStack = [...state.undoStack];

    if (state.notesMode) {
      // Toggle note
      if (state.settings.soundEnabled) playPlaceSound();

      const newNotes = [...newBoard[row][col].notes];
      newNotes[num - 1] = !newNotes[num - 1];

      newUndoStack.push({
        row,
        col,
        prevValue: newBoard[row][col].value,
        prevNotes: [...newBoard[row][col].notes],
      });

      newBoard[row][col] = {
        ...newBoard[row][col],
        notes: newNotes,
      };

      // Notes-only change: no need to recompute errors (notes don't affect conflicts)
      set({
        board: newBoard,
        undoStack: newUndoStack,
      });
    } else {
      // Check if this is a mistake
      const isCorrect = num === cell.solution;
      let newMistakes = state.mistakes;

      if (!isCorrect) {
        newMistakes++;
        if (state.settings.soundEnabled) playErrorSound();
      } else {
        if (state.settings.soundEnabled) playPlaceSound();
      }

      // Save undo state
      newUndoStack.push({
        row,
        col,
        prevValue: newBoard[row][col].value,
        prevNotes: [...newBoard[row][col].notes],
      });

      // Keep only last 20 undos
      if (newUndoStack.length > 20) newUndoStack.shift();

      newBoard[row][col] = {
        ...newBoard[row][col],
        value: num,
        notes: Array(9).fill(false),
      };

      // Clear notes in related cells when placing a number
      for (let c = 0; c < 9; c++) {
        newBoard[row][c].notes[num - 1] = false;
      }
      for (let r = 0; r < 9; r++) {
        newBoard[r][col].notes[num - 1] = false;
      }
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          newBoard[r][c].notes[num - 1] = false;
        }
      }

      // Update errors incrementally (board is already a fresh clone, no double-clone needed)
      updateErrorsIncremental(newBoard, row, col);

      // Check game over (mistake limit reached)
      const mistakeLimit = state.settings.mistakeLimit;
      const isMistakeLimitReached = newMistakes >= mistakeLimit;

      // Check win
      const isComplete = isPuzzleSolved(newBoard);

      // Play win/game over sounds
      if (isComplete && state.settings.soundEnabled) {
        playWinSound();
      } else if (isMistakeLimitReached && state.settings.soundEnabled) {
        playGameOverSound();
      }

      // Check if a number is fully completed (all 9 placed)
      if (isCorrect && state.settings.soundEnabled) {
        const afterCounts = countNumbers(newBoard);
        if (afterCounts[num] === 9) {
          playNumberCompleteSound();
        }
      }

      // Calculate score
      const baseScore = state.score + (isCorrect ? 10 : 0) + (isComplete ? 100 : 0);
      const timeBonus = isComplete ? Math.max(0, 600 - state.timer) : 0;
      const finalScore = baseScore + timeBonus;

      // Check for new best time
      let isNewBest = false;
      if (isComplete) {
        const currentBest = state.stats.fastestTimes[state.difficulty];
        if (currentBest === NO_TIME || state.timer < currentBest) {
          isNewBest = true;
        }
      }

      // Handle level-based game vs classic game differently
      const isLevelGame = state.currentLevel > 0;

      if (isLevelGame && isMistakeLimitReached) {
        // Level game: lose a life instead of immediate game over
        const progress = state.playerProgress;
        const newLives = Math.max(0, progress.lives - 1);
        const newProgress = {
          ...progress,
          lives: newLives,
          lastLifeLostAt: new Date().toISOString(),
        };
        savePlayerProgress(newProgress);

        set({
          board: newBoard,
          mistakes: newMistakes,
          undoStack: newUndoStack,
          score: finalScore,
          isComplete: false,
          isRunning: false,
          isGameOver: true,
          isNewBest: false,
          selectedNumber: num,
          showConfetti: false,
          showLevelFail: true,
          playerProgress: newProgress,
        });

        // Clear saved game
        clearSavedGame();
        return;
      }

      if (isLevelGame && isComplete) {
        // Level game: award coins, mark level complete, +1 hint reward
        const config = getLevelConfig(state.currentLevel);
        const progress = state.playerProgress;

        // Milestone hint bonus: every 5th completed level gives +2 instead of +1
        const completedCount = progress.completedLevels.includes(state.currentLevel)
          ? progress.completedLevels.length
          : progress.completedLevels.length + 1;
        const isMilestone = completedCount % 5 === 0;
        const hintReward = isMilestone ? 2 : 1;

        // Add coins reward + hint reward
        const newProgress = {
          ...progress,
          coins: progress.coins + config.coinsReward,
          totalCoinsEarned: progress.totalCoinsEarned + config.coinsReward,
          completedLevels: progress.completedLevels.includes(state.currentLevel)
            ? progress.completedLevels
            : [...progress.completedLevels, state.currentLevel],
          maxLevelReached: state.currentLevel >= progress.maxLevelReached
            ? state.currentLevel + 1
            : progress.maxLevelReached,
          hints: progress.hints + hintReward,
          totalHintsEarned: progress.totalHintsEarned + hintReward,
        };
        savePlayerProgress(newProgress);

        set({
          board: newBoard,
          mistakes: newMistakes,
          undoStack: newUndoStack,
          score: finalScore,
          isComplete: true,
          isRunning: false,
          isGameOver: false,
          isNewBest,
          selectedNumber: num,
          showConfetti: true,
          showLevelComplete: true,
          playerProgress: newProgress,
        });

        // Also update classic stats/achievements/leaderboard
        const result: GameResult = {
          won: true,
          difficulty: state.difficulty,
          time: state.timer,
          mistakes: newMistakes,
          hintsUsed: state.hintsUsed,
          isDaily: false,
        };
        const newStats = updateStats(state.stats, result);
        const newAchievements = checkAchievements(newStats, result);
        const newLeaderboard = addLeaderboardEntry({
          time: state.timer,
          difficulty: state.difficulty,
          date: new Date().toISOString(),
          mistakes: newMistakes,
          hintsUsed: state.hintsUsed,
        });

        set({
          stats: newStats,
          achievements: newAchievements,
          leaderboard: newLeaderboard,
        });

        clearSavedGame();
        return;
      }

      // Classic game or level game still in progress
      set({
        board: newBoard,
        mistakes: newMistakes,
        undoStack: newUndoStack,
        score: finalScore,
        isComplete,
        isRunning: !isComplete && !isMistakeLimitReached,
        isGameOver: isMistakeLimitReached,
        isNewBest,
        selectedNumber: num,
        showConfetti: isComplete,
      });

      // If game ended (classic), update stats
      if (isComplete || isMistakeLimitReached) {
        const result: GameResult = {
          won: isComplete,
          difficulty: state.difficulty,
          time: state.timer,
          mistakes: newMistakes,
          hintsUsed: state.hintsUsed,
          isDaily: state.isDaily,
        };

        const newStats = updateStats(state.stats, result);
        const newAchievements = checkAchievements(newStats, result);

        if (isComplete) {
          const newLeaderboard = addLeaderboardEntry({
            time: state.timer,
            difficulty: state.difficulty,
            date: new Date().toISOString(),
            mistakes: newMistakes,
            hintsUsed: state.hintsUsed,
          });

          set({
            stats: newStats,
            achievements: newAchievements,
            leaderboard: newLeaderboard,
          });
        } else {
          set({
            stats: newStats,
            achievements: newAchievements,
          });
        }

        // Clear saved game
        clearSavedGame();
      }
    }
  },

  // Erase cell
  eraseCell: () => {
    const state = get();
    if (!state.selectedCell || state.isComplete || state.isPaused || state.isGameOver) return;

    const [row, col] = state.selectedCell;
    const cell = state.board[row][col];
    if (cell.isGiven) return;

    if (state.settings.soundEnabled) playEraseSound();

    const newBoard = cloneBoard(state.board);
    const newUndoStack = [...state.undoStack];

    newUndoStack.push({
      row,
      col,
      prevValue: newBoard[row][col].value,
      prevNotes: [...newBoard[row][col].notes],
    });

    if (newUndoStack.length > 20) newUndoStack.shift();

    newBoard[row][col] = {
      ...newBoard[row][col],
      value: 0,
      notes: Array(9).fill(false),
      isError: false,
    };

    // Update errors in-place (board is already a fresh clone)
    updateErrorsMutate(newBoard);
    set({
      board: newBoard,
      undoStack: newUndoStack,
      selectedNumber: null,
    });
  },

  // Toggle notes mode
  toggleNotesMode: () => {
    const state = get();
    if (state.settings.soundEnabled) playNotesToggleSound(!state.notesMode);
    set({ notesMode: !state.notesMode });
  },

  // Use a hint
  useHint: () => {
    const state = get();
    if (state.isComplete || state.isPaused || state.isGameOver) return;

    // Check if player has hints remaining
    if (state.playerProgress.hints <= 0) return;

    const hint = getHint(state.board);
    if (!hint) return;

    // Decrement global hints
    const progress = state.playerProgress;
    const newProgress = {
      ...progress,
      hints: progress.hints - 1,
      totalHintsUsed: progress.totalHintsUsed + 1,
    };
    savePlayerProgress(newProgress);

    if (state.settings.soundEnabled) playHintSound();

    const newBoard = cloneBoard(state.board);
    const newUndoStack = [...state.undoStack];

    newUndoStack.push({
      row: hint.row,
      col: hint.col,
      prevValue: newBoard[hint.row][hint.col].value,
      prevNotes: [...newBoard[hint.row][hint.col].notes],
    });

    newBoard[hint.row][hint.col] = {
      ...newBoard[hint.row][hint.col],
      value: hint.value,
      notes: Array(9).fill(false),
      isError: false,
      isGiven: true, // Mark as given so it can't be changed
    };

    // Update errors in-place (board is already a fresh clone)
    updateErrorsMutate(newBoard);
    const isComplete = isPuzzleSolved(newBoard);

    if (isComplete && state.settings.soundEnabled) playWinSound();

    const isLevelGame = state.currentLevel > 0;

    if (isLevelGame && isComplete) {
      const config = getLevelConfig(state.currentLevel);
      // Milestone hint bonus: every 5th completed level gives +2 instead of +1
      const completedCount = newProgress.completedLevels.includes(state.currentLevel)
        ? newProgress.completedLevels.length
        : newProgress.completedLevels.length + 1;
      const isMilestone = completedCount % 5 === 0;
      const hintReward = isMilestone ? 2 : 1;

      const levelCompleteProgress = {
        ...newProgress,
        coins: newProgress.coins + config.coinsReward,
        totalCoinsEarned: newProgress.totalCoinsEarned + config.coinsReward,
        completedLevels: newProgress.completedLevels.includes(state.currentLevel)
          ? newProgress.completedLevels
          : [...newProgress.completedLevels, state.currentLevel],
        maxLevelReached: state.currentLevel >= newProgress.maxLevelReached
          ? state.currentLevel + 1
          : newProgress.maxLevelReached,
        hints: newProgress.hints + hintReward,
        totalHintsEarned: newProgress.totalHintsEarned + hintReward,
      };
      savePlayerProgress(levelCompleteProgress);

      set({
        board: newBoard,
        hintsUsed: state.hintsUsed + 1,
        undoStack: newUndoStack,
        selectedCell: [hint.row, hint.col],
        selectedNumber: hint.value,
        isComplete: true,
        isRunning: false,
        showConfetti: true,
        showLevelComplete: true,
        playerProgress: levelCompleteProgress,
      });

      const result: GameResult = {
        won: true,
        difficulty: state.difficulty,
        time: state.timer,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed + 1,
        isDaily: false,
      };
      const newStats = updateStats(state.stats, result);
      const newAchievements = checkAchievements(newStats, result);
      const newLeaderboard = addLeaderboardEntry({
        time: state.timer,
        difficulty: state.difficulty,
        date: new Date().toISOString(),
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed + 1,
      });

      set({
        stats: newStats,
        achievements: newAchievements,
        leaderboard: newLeaderboard,
      });

      clearSavedGame();
      return;
    }

    set({
      board: newBoard,
      hintsUsed: state.hintsUsed + 1,
      undoStack: newUndoStack,
      selectedCell: [hint.row, hint.col],
      selectedNumber: hint.value,
      isComplete,
      isRunning: !isComplete,
      showConfetti: isComplete,
      playerProgress: newProgress,
    });

    if (isComplete) {
      const result: GameResult = {
        won: true,
        difficulty: state.difficulty,
        time: state.timer,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed + 1,
        isDaily: state.isDaily,
      };

      const newStats = updateStats(state.stats, result);
      const newAchievements = checkAchievements(newStats, result);
      const newLeaderboard = addLeaderboardEntry({
        time: state.timer,
        difficulty: state.difficulty,
        date: new Date().toISOString(),
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed + 1,
      });

      set({
        stats: newStats,
        achievements: newAchievements,
        leaderboard: newLeaderboard,
      });

      clearSavedGame();
    }
  },

  // Undo last action
  undo: () => {
    const state = get();
    if (state.undoStack.length === 0 || state.isComplete || state.isPaused || state.isGameOver) return;

    if (state.settings.soundEnabled) playUndoSound();

    const action = state.undoStack[state.undoStack.length - 1];
    const newBoard = cloneBoard(state.board);

    newBoard[action.row][action.col] = {
      ...newBoard[action.row][action.col],
      value: action.prevValue,
      notes: [...action.prevNotes],
    };

    // Update errors in-place (board is already a fresh clone)
    updateErrorsMutate(newBoard);
    const newUndoStack = state.undoStack.slice(0, -1);

    set({
      board: newBoard,
      undoStack: newUndoStack,
      selectedCell: [action.row, action.col],
    });
  },

  // Pause game
  pauseGame: () => {
    set({ isPaused: true, isRunning: false });

    // Save game state
    const state = get();
    if (state.board.length > 0) {
      saveGame({
        board: JSON.stringify(state.board),
        difficulty: state.difficulty,
        timer: state.timer,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        score: state.score,
        notesMode: state.notesMode,
        undoStack: JSON.stringify(state.undoStack),
        isDaily: state.isDaily,
        dailyDate: state.dailyDate,
        savedAt: new Date().toISOString(),
      });
    }
  },

  // Resume from pause
  resumeGameTimer: () => {
    set({ isPaused: false, isRunning: true });
  },

  // Timer tick
  tickTimer: () => {
    set((state) => ({ timer: state.timer + 1 }));
  },

  // Give up
  giveUp: () => {
    const state = get();
    const isLevelGame = state.currentLevel > 0;

    if (isLevelGame) {
      // Level game: lose a life
      const progress = state.playerProgress;
      const newLives = Math.max(0, progress.lives - 1);
      const newProgress = {
        ...progress,
        lives: newLives,
        lastLifeLostAt: new Date().toISOString(),
      };
      savePlayerProgress(newProgress);

      set({
        isGameOver: true,
        isRunning: false,
        isComplete: false,
        showLevelFail: true,
        playerProgress: newProgress,
      });
    } else {
      // Classic game
      const result: GameResult = {
        won: false,
        difficulty: state.difficulty,
        time: state.timer,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        isDaily: state.isDaily,
      };

      const newStats = updateStats(state.stats, result);
      const newAchievements = checkAchievements(newStats, result);

      set({
        isGameOver: true,
        isRunning: false,
        isComplete: false,
        stats: newStats,
        achievements: newAchievements,
      });
    }

    clearSavedGame();
  },

  // Cheat solve
  cheatSolve: () => {
    const state = get();
    const solvedBoard = solveBoard(state.board);

    if (state.settings.soundEnabled) playWinSound();

    set({
      board: solvedBoard,
      isComplete: true,
      isRunning: false,
      showConfetti: true,
    });
  },

  // Update settings
  updateSettings: (partial) => {
    const state = get();
    const newSettings = { ...state.settings, ...partial };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  // Mark tutorial seen
  markTutorialComplete: () => {
    markTutorialSeen();
    set({ tutorialSeen: true });
  },

  // Auto-fill notes
  doAutoFillNotes: () => {
    const state = get();
    if (!state.board || state.board.length === 0) return;
    const newBoard = autoFillNotes(state.board);
    set({ board: newBoard });
  },

  // Add hints (from rewards, milestones, daily, etc.)
  addHints: (amount: number) => {
    const state = get();
    const progress = state.playerProgress;
    const newProgress = {
      ...progress,
      hints: progress.hints + amount,
      totalHintsEarned: progress.totalHintsEarned + amount,
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
  },

  // Claim daily hint reward (once per day)
  claimDailyHint: (): boolean => {
    const state = get();
    const progress = state.playerProgress;
    if (!canClaimDailyHint(progress.lastDailyHintAt)) return false;

    const newProgress = {
      ...progress,
      hints: progress.hints + 1,
      totalHintsEarned: progress.totalHintsEarned + 1,
      lastDailyHintAt: getTodayString(),
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
    return true;
  },

  // Earn hint from watching an ad (with cooldown)
  earnHintFromAd: (): boolean => {
    const state = get();
    const progress = state.playerProgress;
    if (!canWatchAdForHint(progress.lastAdHintAt)) return false;

    const newProgress = {
      ...progress,
      hints: progress.hints + 1,
      totalHintsEarned: progress.totalHintsEarned + 1,
      lastAdHintAt: new Date().toISOString(),
    };
    savePlayerProgress(newProgress);
    set({ playerProgress: newProgress });
    return true;
  },

  // Get current hints remaining
  getHintsRemaining: (): number => {
    return get().playerProgress.hints;
  },
}));

// Expose the store instance globally for the native Android back-press handler.
// window.__sudokuHandleBackPress() (injected by SudokuWebViewClient.onPageFinished)
// reads window.__sudokuStore to access currentScreen and goBack().
if (typeof window !== 'undefined') {
  (window as any).__sudokuStore = useSudokuStore;
}
