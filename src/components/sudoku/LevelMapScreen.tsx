'use client';

import React, { useState, useMemo } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { getLevelConfig } from '@/lib/sudoku-storage';
import { initAudio } from '@/lib/sudoku-sounds';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Lock, CheckCircle2, Play,
  Coins, AlertTriangle, Star, Zap, Flame,
} from 'lucide-react';
import LivesDisplay from './LivesDisplay';
import HintsDisplay from './HintsDisplay';

const LevelMapScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const startLevel = useSudokuStore((s) => s.startLevel);
  const playerProgress = useSudokuStore((s) => s.playerProgress);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    playerProgress.maxLevelReached
  );

  const handleStartLevel = (level: number) => {
    initAudio();
    startLevel(level);
  };

  const { completedLevels, maxLevelReached, lives } = playerProgress;

  // The highest level the player can play (unlocked)
  // maxLevelReached represents the highest unlocked level
  // We also show maxLevelReached + 1 as the "next locked" level
  const maxVisibleLevel = maxLevelReached + 1;

  // Selected level config
  const selectedConfig = selectedLevel ? getLevelConfig(selectedLevel) : null;
  const isSelectedCompleted = selectedLevel ? completedLevels.includes(selectedLevel) : false;
  const isSelectedLocked = selectedLevel ? selectedLevel > maxLevelReached : false;
  const canPlaySelected = selectedLevel !== null && !isSelectedLocked && lives > 0;

  // Difficulty color mapping - subtle tint only, no section headers
  const difficultyColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    easy: {
      bg: 'from-emerald-500/15 to-emerald-600/8',
      border: 'border-emerald-500/25',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    medium: {
      bg: 'from-amber-500/15 to-amber-600/8',
      border: 'border-amber-500/25',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10',
    },
    hard: {
      bg: 'from-red-500/15 to-red-600/8',
      border: 'border-red-500/25',
      text: 'text-red-400',
      glow: 'shadow-red-500/10',
    },
  };

  // Generate the list of visible levels: all unlocked + next locked
  const visibleLevels = useMemo(() => {
    const levels: number[] = [];
    for (let i = 1; i <= maxVisibleLevel; i++) {
      levels.push(i);
    }
    return levels;
  }, [maxVisibleLevel]);

  // Stars based on difficulty (visual indicator)
  const difficultyStars: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  return (
    <div className="animate-fade-in relative flex flex-col min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-gradient" aria-hidden="true">
        <div className="floating-orb absolute top-[10%] left-[15%] w-64 h-64 rounded-full bg-cyan-500/8 blur-3xl" style={{ animationDelay: '0s' }} />
        <div className="floating-orb absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-purple-500/8 blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="floating-orb absolute top-[50%] left-[50%] w-56 h-56 rounded-full bg-amber-500/6 blur-3xl" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <div className="glass-card border-b border-white/10 px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen('home')}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-white/10 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold">Level Map</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {completedLevels.length} levels completed
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="sm:hidden"><HintsDisplay compact={true} /></div>
          <div className="hidden sm:block"><HintsDisplay compact={true} showAdButton={true} /></div>
          <div className="sm:hidden"><LivesDisplay mini={true} /></div>
          <div className="hidden sm:block"><LivesDisplay compact={true} /></div>
        </div>
      </div>

      {/* Level Grid */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-5">
        {/* Progress section */}
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Campaign Progress</span>
            <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Level {maxLevelReached} unlocked
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${Math.min((completedLevels.length / 50) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_linear_infinite]" />
            </div>
          </div>
        </div>

        {/* Level grid - no difficulty sections, just a continuous grid */}
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
            {visibleLevels.map((level) => {
              const isCompleted = completedLevels.includes(level);
              const isLocked = level > maxLevelReached;
              const isSelected = level === selectedLevel;
              const isClickable = !isLocked && lives > 0;
              const config = getLevelConfig(level);
              const colors = difficultyColors[config.difficulty];
              const stars = difficultyStars[config.difficulty];

              return (
                <button
                  key={level}
                  onClick={() => {
                    if (isClickable) setSelectedLevel(level);
                  }}
                  disabled={!isClickable}
                  className={`
                    relative w-full aspect-square rounded-xl text-sm sm:text-base font-bold
                    flex flex-col items-center justify-center gap-0.5
                    transition-all duration-200 border-2
                    ${isSelected && !isLocked
                      ? `bg-gradient-to-br ${colors.bg} ${colors.border} ${colors.text} ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_16px_rgba(34,211,238,0.3)]`
                      : isCompleted
                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/35 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.12)] hover:scale-105'
                        : isLocked
                          ? 'bg-white/[0.03] border-white/[0.06] text-white/15 cursor-not-allowed'
                          : `bg-gradient-to-br ${colors.bg} border-white/12 text-foreground/60 hover:scale-105 hover:border-cyan-400/30`
                    }
                  `}
                  title={`Level ${level} — ${config.difficulty}${isCompleted ? ' (Complete)' : ''}${isLocked ? ' (Locked)' : ''}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-40" />
                  ) : (
                    <span>{level}</span>
                  )}
                  {/* Difficulty indicator dots */}
                  {!isLocked && !isCompleted && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: stars }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            config.difficulty === 'easy' ? 'bg-emerald-400/60' :
                            config.difficulty === 'medium' ? 'bg-amber-400/60' :
                            'bg-red-400/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacer for bottom panel */}
        <div className="h-24 sm:h-28" />
      </div>

      {/* Selected Level Info Panel - Fixed bottom */}
      {selectedLevel !== null && selectedConfig && (
        <div className="fixed bottom-0 left-0 right-0 z-30 animate-slide-up safe-bottom">
          <div className="glass-card border-t border-white/15 px-4 py-3 sm:py-4 max-w-lg mx-auto" style={{
            background: 'rgba(15, 15, 30, 0.92)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Level icon */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${difficultyColors[selectedConfig.difficulty].bg} border ${difficultyColors[selectedConfig.difficulty].border} flex items-center justify-center shrink-0`}>
                {isSelectedCompleted ? (
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                ) : isSelectedLocked ? (
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white/30" />
                ) : (
                  <span className={`text-lg sm:text-xl font-extrabold ${difficultyColors[selectedConfig.difficulty].text}`}>
                    {selectedLevel}
                  </span>
                )}
              </div>

              {/* Level info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base">
                    Level {selectedLevel}
                  </span>
                  {isSelectedCompleted && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium">
                      DONE
                    </span>
                  )}
                  {isSelectedLocked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 border border-white/10 font-medium">
                      LOCKED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded border ${difficultyColors[selectedConfig.difficulty].bg} ${difficultyColors[selectedConfig.difficulty].border} ${difficultyColors[selectedConfig.difficulty].text}`}>
                    {selectedConfig.difficulty.charAt(0).toUpperCase() + selectedConfig.difficulty.slice(1)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    +{selectedConfig.coinsReward}
                  </span>
                  {!isSelectedLocked && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />
                      5 max mistakes
                    </span>
                  )}
                </div>
              </div>

              {/* Play button */}
              {canPlaySelected && (
                <Button
                  onClick={() => handleStartLevel(selectedLevel)}
                  disabled={lives === 0}
                  className="btn-3d shrink-0 font-bold rounded-xl px-5 sm:px-6 py-3 sm:py-4 transition-all duration-300 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  <span className="text-sm">Play</span>
                </Button>
              )}
            </div>

            {/* No lives warning */}
            {lives === 0 && !isSelectedLocked && (
              <div className="mt-2 text-center text-xs text-red-400 font-medium">
                No lives remaining — wait for regeneration or watch an ad
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelMapScreen;
