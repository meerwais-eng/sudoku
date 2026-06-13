'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { formatTime, saveGame } from '@/lib/sudoku-storage';
import { startBackgroundMusic, stopBackgroundMusic, initAudio } from '@/lib/sudoku-sounds';
import { showFooterBanner, hideFooterBanner, prepareInterstitial, showInterstitialAd } from '@/lib/admob-service';
import { Button } from '@/components/ui/button';
import SudokuGrid from './SudokuGrid';
import NumberPad from './NumberPad';
import ConfettiEffect from './ConfettiEffect';
import LivesDisplay from './LivesDisplay';
import HintsDisplay from './HintsDisplay';
import LevelFailDialog from './LevelFailDialog';
import LevelCompleteScreen from './LevelCompleteScreen';
import {
  ArrowLeft, Pause, Play, RotateCcw, Home,
  Sparkles, Clock, AlertTriangle, Volume2, VolumeX, Music, Music2,
  RefreshCw, Lightbulb,
} from 'lucide-react';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';

const GameScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const timer = useSudokuStore((s) => s.timer);
  const tickTimer = useSudokuStore((s) => s.tickTimer);
  const isRunning = useSudokuStore((s) => s.isRunning);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const hintsUsed = useSudokuStore((s) => s.hintsUsed);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const isPaused = useSudokuStore((s) => s.isPaused);
  const isGameOver = useSudokuStore((s) => s.isGameOver);
  const isNewBest = useSudokuStore((s) => s.isNewBest);
  const pauseGame = useSudokuStore((s) => s.pauseGame);
  const resumeGameTimer = useSudokuStore((s) => s.resumeGameTimer);
  const startNewGame = useSudokuStore((s) => s.startNewGame);
  const startQuickGame = useSudokuStore((s) => s.startQuickGame);
  const giveUp = useSudokuStore((s) => s.giveUp);
  const showConfetti = useSudokuStore((s) => s.showConfetti);
  const setShowConfetti = useSudokuStore((s) => s.setShowConfetti);
  const settings = useSudokuStore((s) => s.settings);
  const isDaily = useSudokuStore((s) => s.isDaily);
  const isGenerating = useSudokuStore((s) => s.isGenerating);
  const updateSettings = useSudokuStore((s) => s.updateSettings);
  const board = useSudokuStore((s) => s.board);
  const notesMode = useSudokuStore((s) => s.notesMode);
  const undoStack = useSudokuStore((s) => s.undoStack);
  const score = useSudokuStore((s) => s.score);
  const isDailyGame = useSudokuStore((s) => s.isDaily);
  const dailyDate = useSudokuStore((s) => s.dailyDate);
  const currentLevel = useSudokuStore((s) => s.currentLevel);
  const showLevelComplete = useSudokuStore((s) => s.showLevelComplete);
  const showLevelFail = useSudokuStore((s) => s.showLevelFail);
  const isQuickGame = useSudokuStore((s) => s.isQuickGame);
  const quickGameDifficulty = useSudokuStore((s) => s.quickGameDifficulty);
  const hintsRemaining = useSudokuStore((s) => s.playerProgress.hints);

  // Hint notification state
  const [hintNotification, setHintNotification] = React.useState<{ show: boolean; remaining: number }>({ show: false, remaining: 0 });
  const prevHintsRef = useRef(hintsRemaining);

  // Detect hint usage and show notification
  useEffect(() => {
    if (prevHintsRef.current > hintsRemaining && hintsRemaining >= 0) {
      setHintNotification({ show: true, remaining: hintsRemaining });
      const timer = setTimeout(() => setHintNotification({ show: false, remaining: 0 }), 2000);
      return () => clearTimeout(timer);
    }
    prevHintsRef.current = hintsRemaining;
  }, [hintsRemaining]);

  // Track whether we started music for this game session
  const musicStartedRef = useRef(false);

  // Background music control
  useEffect(() => {
    const shouldPlay = isRunning && !isPaused && !isComplete && !isGameOver && settings.bgMusicEnabled && settings.soundEnabled && !isGenerating;

    if (shouldPlay) {
      initAudio();
      startBackgroundMusic();
      musicStartedRef.current = true;
    } else if (musicStartedRef.current) {
      stopBackgroundMusic();
      musicStartedRef.current = false;
    }
  }, [isRunning, isPaused, isComplete, isGameOver, settings.bgMusicEnabled, settings.soundEnabled, isGenerating]);

  // Stop music when leaving the game screen
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
      musicStartedRef.current = false;
    };
  }, []);

  // --- AdMob: Footer banner ad ---
  // Show footer banner when game screen is active, hide on unmount
  useEffect(() => {
    showFooterBanner();
    return () => {
      hideFooterBanner();
    };
  }, []);

  // --- AdMob: Prepare interstitial for later display ---
  useEffect(() => {
    prepareInterstitial();
  }, []);

  // --- AdMob: Show interstitial ad after puzzle completion or game over ---
  const adsShownRef = useRef(false);
  useEffect(() => {
    if ((isComplete || isGameOver) && !adsShownRef.current && !isPaused) {
      adsShownRef.current = true;
      // Hide banner before showing interstitial for better UX
      hideFooterBanner();
      // Small delay so the completion dialog appears first
      const timer = setTimeout(() => {
        showInterstitialAd().then(() => {
          // Re-show banner after interstitial is dismissed
          showFooterBanner();
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isGameOver, isPaused]);

  // Auto-save on timer tick (every 5 seconds)
  const lastSaveRef = useRef(0);
  useEffect(() => {
    if (!isRunning || timer <= 0) return;
    if (timer % 5 !== 0 || timer === lastSaveRef.current) return;
    lastSaveRef.current = timer;
    // Read current state directly from store to avoid dependency on rapidly-changing values
    const state = useSudokuStore.getState();
    if (!state.board || state.board.length === 0) return;
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
  }, [timer, isRunning]);

  // Save game state when page goes to background
  useEffect(() => {
    const saveCurrentGame = () => {
      const state = useSudokuStore.getState();
      if (state.board && state.board.length > 0 && !state.isComplete && !state.isGameOver) {
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
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentGame();
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentGame();
    };

    const handlePageHide = () => {
      saveCurrentGame();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const state = useSudokuStore.getState();
      if (state.isComplete || state.isPaused || state.isGameOver) return;

      const selectedCell = state.selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        state.enterNumber(parseInt(e.key));
        return;
      }

      if (e.key.startsWith('Arrow') && selectedCell) {
        e.preventDefault();
        let [row, col] = selectedCell;
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
        state.selectCell(row, col);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        state.eraseCell();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        state.toggleNotesMode();
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        state.useHint();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        state.updateSettings({ soundEnabled: !state.settings.soundEnabled });
        return;
      }

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        state.undo();
        return;
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tickTimer]);

  const difficultyColors: Record<string, string> = {
    easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const maxMistakes = currentLevel > 0 ? 5 : settings.mistakeLimit;

  const handleGoHome = useCallback(() => {
    const state = useSudokuStore.getState();
    if (state.board && state.board.length > 0 && !state.isComplete && !state.isGameOver) {
      pauseGame();
    }
    setScreen('home');
  }, [pauseGame, setScreen]);

  const handleToggleBgMusic = useCallback(() => {
    initAudio();
    updateSettings({ bgMusicEnabled: !settings.bgMusicEnabled });
  }, [settings.bgMusicEnabled, updateSettings]);

  const handleToggleSound = useCallback(() => {
    initAudio();
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Quick Game: Play Again with same difficulty
  const handlePlayAgainQuick = useCallback(() => {
    if (quickGameDifficulty) {
      startQuickGame(quickGameDifficulty);
    }
  }, [quickGameDifficulty, startQuickGame]);

  // Determine game mode label
  const getGameModeLabel = () => {
    if (currentLevel > 0) return `Lv.${currentLevel}`;
    if (isQuickGame) return 'Quick';
    if (isDaily) return 'Daily';
    return '';
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Level Complete Screen (overrides normal view for level games) */}
      {showLevelComplete && currentLevel > 0 ? (
        <LevelCompleteScreen />
      ) : (
      <>
      {/* Top Bar */}
      <div className="glass-card border-b border-white/10">
        {/* Row 1: Back, difficulty, Lives, Hints; on sm+ also timer/mistakes/controls */}
        <div className="flex items-center justify-between px-2 py-1.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoHome}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md border ${difficultyColors[difficulty]}`}>
              {getGameModeLabel() && `${getGameModeLabel()} · `}{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Lives & Coins - mini on mobile, compact on sm+ - only for campaign levels */}
            {currentLevel > 0 && (
              <>
                <div className="sm:hidden"><LivesDisplay mini={true} /></div>
                <div className="hidden sm:block"><LivesDisplay compact={true} /></div>
              </>
            )}

            {/* Hints indicator */}
            <HintsDisplay compact={true} />

            {/* Timer, Mistakes, Controls - visible on sm+ screens */}
            <div className="hidden sm:flex items-center gap-2">
              {settings.showTimer && (
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={timer > 600 ? 'text-amber-400' : ''}>{formatTime(timer)}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${mistakes > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {mistakes}/{maxMistakes}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleBgMusic}
                className="h-9 w-9 rounded-lg hover:bg-white/10"
                title={settings.bgMusicEnabled ? 'Mute background music' : 'Play background music'}
              >
                {settings.bgMusicEnabled && settings.soundEnabled
                  ? <Music2 className="w-4 h-4 text-purple-400" />
                  : <Music className="w-4 h-4 text-muted-foreground/40" />
                }
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSound}
                className="h-9 w-9 rounded-lg hover:bg-white/10"
                title={settings.soundEnabled ? 'Mute all sounds' : 'Unmute sounds'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={isPaused ? resumeGameTimer : pauseGame}
                className="h-9 w-9 rounded-lg hover:bg-white/10"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile-only second row: Timer, Mistakes, Music, Sound, Pause */}
        <div className="flex items-center justify-between px-2 py-1 border-t border-white/5 sm:hidden">
          <div className="flex items-center gap-1.5">
            {settings.showTimer && (
              <div className="flex items-center gap-0.5 text-[10px] font-mono">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className={timer > 600 ? 'text-amber-400' : ''}>{formatTime(timer)}</span>
              </div>
            )}

            <div className="flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
              <span className={`text-[10px] ${mistakes > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {mistakes}/{maxMistakes}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleBgMusic}
              className="top-bar-btn h-6 w-6 rounded-md hover:bg-white/10"
              title={settings.bgMusicEnabled ? 'Mute background music' : 'Play background music'}
            >
              {settings.bgMusicEnabled && settings.soundEnabled
                ? <Music2 className="w-3 h-3 text-purple-400" />
                : <Music className="w-3 h-3 text-muted-foreground/40" />
              }
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="top-bar-btn h-6 w-6 rounded-md hover:bg-white/10"
              title={settings.soundEnabled ? 'Mute all sounds' : 'Unmute sounds'}
            >
              {settings.soundEnabled ? <Volume2 className="w-3 h-3 text-cyan-400" /> : <VolumeX className="w-3 h-3 text-muted-foreground" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={isPaused ? resumeGameTimer : pauseGame}
              className="top-bar-btn h-6 w-6 rounded-md hover:bg-white/10"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-3 md:p-4 gap-2 sm:gap-4 md:gap-6 overflow-y-auto">
        {/* Generating overlay */}
        {isGenerating ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="relative">
              <div className="animate-spin w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl animate-pulse">🧩</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm animate-pulse">Generating puzzle...</p>
          </div>
        ) : (
          <>
            <SudokuGrid />
            <NumberPad />
          </>
        )}
      </div>

      {/* Confetti */}
      <ConfettiEffect
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Hint Used Notification */}
      {hintNotification.show && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="glass-card rounded-xl px-4 py-2.5 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">
              Hint used! {hintNotification.remaining} remaining
            </span>
          </div>
        </div>
      )}

      {/* ====== QUICK GAME WIN DIALOG ====== */}
      {isQuickGame && currentLevel === 0 && (
      <Dialog open={isComplete && !isGameOver} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-white/15 max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl animate-bounce">🎉</div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Puzzle Solved!
              </h2>
              {isNewBest && (
                <div className="flex items-center justify-center gap-1 mt-1 text-amber-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  New Best Time!
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="font-bold text-lg">{formatTime(timer)}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Mistakes</div>
                <div className="font-bold text-lg">{mistakes}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Hints</div>
                <div className="font-bold text-lg">{hintsUsed}</div>
              </div>
            </div>

            {/* Quick Game: Play Again? */}
            <div className="pt-2 space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Play Again?</p>
              <Button
                onClick={handlePlayAgainQuick}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play Again ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setScreen('home')}
                className="w-full hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* ====== QUICK GAME OVER DIALOG ====== */}
      {isQuickGame && currentLevel === 0 && (
      <Dialog open={isGameOver} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-white/15 max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">💔</div>
            <h2 className="text-2xl font-bold text-red-400">Game Over</h2>
            <p className="text-muted-foreground text-sm">
              Too many mistakes! Don&apos;t give up — try again.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="font-bold">{formatTime(timer)}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Mistakes</div>
                <div className="font-bold text-red-400">{mistakes}/{maxMistakes}</div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                onClick={handlePlayAgainQuick}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setScreen('home')}
                className="w-full hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* ====== CLASSIC GAME WIN DIALOG (daily/non-quick) ====== */}
      {!isQuickGame && currentLevel === 0 && (
      <Dialog open={isComplete && !isGameOver} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-white/15 max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl animate-bounce">🎉</div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Puzzle Solved!
              </h2>
              {isNewBest && (
                <div className="flex items-center justify-center gap-1 mt-1 text-amber-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  New Best Time!
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="font-bold text-lg">{formatTime(timer)}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Mistakes</div>
                <div className="font-bold text-lg">{mistakes}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Hints</div>
                <div className="font-bold text-lg">{hintsUsed}</div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => startNewGame(difficulty)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                Play Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => setScreen('home')}
                className="w-full hover:bg-white/10"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* ====== CLASSIC GAME OVER DIALOG ====== */}
      {!isQuickGame && currentLevel === 0 && (
      <Dialog open={isGameOver} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-white/15 max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl">💔</div>
            <h2 className="text-2xl font-bold text-red-400">Game Over</h2>
            <p className="text-muted-foreground text-sm">
              Too many mistakes! Don&apos;t give up — try again.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="font-bold">{formatTime(timer)}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Mistakes</div>
                <div className="font-bold text-red-400">{mistakes}/{maxMistakes}</div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => startNewGame(difficulty)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => setScreen('home')}
                className="w-full hover:bg-white/10"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Level Fail Dialog (for campaign level games) */}
      {currentLevel > 0 && (
        <LevelFailDialog />
      )}

      {/* Pause Dialog */}
      <Dialog open={isPaused && !isComplete && !isGameOver && !(showLevelFail && currentLevel > 0)} onOpenChange={(open) => { if (open === false) resumeGameTimer(); }}>
        <DialogContent className="glass-card border-white/15 max-w-sm">
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">⏸️</div>
            <h2 className="text-xl font-bold">Game Paused</h2>
            <p className="text-muted-foreground text-sm">Take a breather. The timer is paused.</p>
            <div className="space-y-2 pt-2">
              <Button
                onClick={resumeGameTimer}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (isQuickGame) {
                    startQuickGame(difficulty);
                  } else {
                    startNewGame(difficulty);
                  }
                }}
                className="w-full hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  giveUp();
                  setScreen('home');
                }}
                className="w-full hover:bg-red-500/10 text-red-400"
              >
                <Home className="w-4 h-4 mr-2" />
                Quit Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
};

export default GameScreen;
