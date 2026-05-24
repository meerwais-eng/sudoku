'use client';

import React from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { formatTime, getLevelConfig } from '@/lib/sudoku-storage';
import { Button } from '@/components/ui/button';
import ConfettiEffect from './ConfettiEffect';
import { Clock, AlertTriangle, Lightbulb, Coins, ChevronRight, Home, Trophy } from 'lucide-react';

const LevelCompleteScreen: React.FC = () => {
  const currentLevel = useSudokuStore((s) => s.currentLevel);
  const timer = useSudokuStore((s) => s.timer);
  const mistakes = useSudokuStore((s) => s.mistakes);
  const hintsUsed = useSudokuStore((s) => s.hintsUsed);
  const playerProgress = useSudokuStore((s) => s.playerProgress);
  const startNextLevel = useSudokuStore((s) => s.startNextLevel);
  const dismissLevelComplete = useSudokuStore((s) => s.dismissLevelComplete);
  const setScreen = useSudokuStore((s) => s.setScreen);
  const showConfetti = useSudokuStore((s) => s.showConfetti);
  const setShowConfetti = useSudokuStore((s) => s.setShowConfetti);

  const config = getLevelConfig(currentLevel);
  const completedCount = playerProgress.completedLevels.length;
  // Progress display relative to a milestone (50 levels = 100% for display)
  const progressPercent = Math.min(Math.round((completedCount / 50) * 100), 100);

  // Milestone hint bonus: every 5th completed level gives +2 hints instead of +1
  const isMilestone = completedCount % 5 === 0 && completedCount > 0;
  const hintReward = isMilestone ? 2 : 1;

  const handleNextLevel = () => {
    dismissLevelComplete();
    startNextLevel();
  };

  const handleBackToHome = () => {
    dismissLevelComplete();
    setScreen('home');
  };

  const handleBackToLevelMap = () => {
    dismissLevelComplete();
    setScreen('levelMap');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg" />
      <div className="pointer-events-none absolute inset-0 -z-[1]" aria-hidden="true">
        <div className="floating-orb absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="floating-orb absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-purple-500/15 blur-3xl" style={{ animationDelay: '1.5s' }} />
        <div className="floating-orb absolute top-[50%] left-[50%] w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" style={{ animationDelay: '3s' }} />
      </div>

      {/* Confetti */}
      <ConfettiEffect show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Main content card */}
      <div className="animate-slide-in-3d relative z-10 w-full max-w-md">
        <div className="glass-card card-3d rounded-2xl p-6 sm:p-8 space-y-6 text-center">
          {/* Celebration icon */}
          <div className="animate-bounce-in">
            <div className="text-6xl sm:text-7xl mb-2">🎉</div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Level Complete!
            </h1>
            <p className="text-lg font-semibold text-cyan-300 mt-2">
              Level {currentLevel}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Campaign Progress</span>
              <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {completedCount} completed ({progressPercent}%)
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer effect on the progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_linear_infinite]" />
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-3d glass-card rounded-xl p-3 space-y-1">
              <Clock className="w-4 h-4 mx-auto text-cyan-400" />
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="font-bold text-base sm:text-lg">{formatTime(timer)}</div>
            </div>
            <div className="card-3d glass-card rounded-xl p-3 space-y-1">
              <AlertTriangle className="w-4 h-4 mx-auto text-amber-400" />
              <div className="text-xs text-muted-foreground">Mistakes</div>
              <div className="font-bold text-base sm:text-lg">{mistakes}</div>
            </div>
            <div className="card-3d glass-card rounded-xl p-3 space-y-1">
              <Lightbulb className="w-4 h-4 mx-auto text-purple-400" />
              <div className="text-xs text-muted-foreground">Hints</div>
              <div className="font-bold text-base sm:text-lg">{hintsUsed}</div>
            </div>
          </div>

          {/* Coins earned */}
          <div className="animate-bounce-in card-3d glass-card rounded-xl p-4 flex items-center justify-center gap-3 border border-amber-400/20">
            <Coins className="w-6 h-6 text-amber-400 animate-[float_2s_ease-in-out_infinite]" />
            <span className="text-2xl font-extrabold text-amber-400">+{config.coinsReward}</span>
            <span className="text-sm text-muted-foreground">coins earned</span>
          </div>

          {/* Hint earned + total remaining */}
          <div className={`animate-bounce-in card-3d glass-card rounded-xl p-4 flex items-center justify-center gap-3 ${isMilestone ? 'border border-purple-400/40 shadow-[0_0_16px_rgba(168,85,247,0.3)]' : 'border border-purple-400/20'}`}>
            <Lightbulb className={`w-6 h-6 text-purple-400 animate-[float_2s_ease-in-out_infinite]`} />
            <span className="text-2xl font-extrabold text-purple-400">+{hintReward}</span>
            <span className="text-sm text-muted-foreground">hint{hintReward > 1 ? 's' : ''} earned</span>
            <span className="text-xs text-purple-300/70 font-medium ml-2">({playerProgress.hints} total)</span>
            {isMilestone && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 animate-pulse">
                MILESTONE!
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleNextLevel}
              className="btn-3d w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg py-6 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Start Level {currentLevel + 1}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>

            <Button
              variant="ghost"
              onClick={handleBackToLevelMap}
              className="w-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Level Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelCompleteScreen;
