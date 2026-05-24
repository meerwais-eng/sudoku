'use client';

import React, { useState, useCallback } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { formatTime, getTodayString, NO_TIME, canClaimDailyHint } from '@/lib/sudoku-storage';
import { initAudio } from '@/lib/sudoku-sounds';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Trophy, Calendar, Flame, Star, ChevronRight, Sparkles,
  Play, Map, Volume2, VolumeX, Home as HomeIcon, BarChart3, Settings as SettingsIcon,
  Zap, Gamepad2, Lightbulb,
} from 'lucide-react';
import LivesDisplay from './LivesDisplay';
import HintsDisplay from './HintsDisplay';

const HomeScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const startQuickGame = useSudokuStore((s) => s.startQuickGame);
  const stats = useSudokuStore((s) => s.stats);
  const settings = useSudokuStore((s) => s.settings);
  const board = useSudokuStore((s) => s.board);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const dailyDate = useSudokuStore((s) => s.dailyDate);
  const timer = useSudokuStore((s) => s.timer);
  const resumeGame = useSudokuStore((s) => s.resumeGame);
  const tutorialSeen = useSudokuStore((s) => s.tutorialSeen);
  const markTutorialComplete = useSudokuStore((s) => s.markTutorialComplete);
  const updateSettings = useSudokuStore((s) => s.updateSettings);
  const playerProgress = useSudokuStore((s) => s.playerProgress);
  const startNewGame = useSudokuStore((s) => s.startNewGame);
  const claimDailyHint = useSudokuStore((s) => s.claimDailyHint);

  const [showTutorial, setShowTutorial] = useState(!tutorialSeen);
  const [soundBounce, setSoundBounce] = useState(false);
  const [hintClaimed, setHintClaimed] = useState(false);

  const today = getTodayString();
  const dailyCompleted = stats.dailyCompleted.includes(today);
  const hasSavedGame = board && board.length > 0;
  const dailyHintAvailable = canClaimDailyHint(playerProgress.lastDailyHintAt);

  const handleStartQuickGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    initAudio();
    startQuickGame(difficulty);
  };

  const handleStartDaily = () => {
    initAudio();
    startNewGame('medium', true);
  };

  const handleSoundToggle = useCallback(() => {
    initAudio();
    updateSettings({ soundEnabled: !settings.soundEnabled });
    setSoundBounce(true);
    setTimeout(() => setSoundBounce(false), 400);
  }, [settings.soundEnabled, updateSettings]);

  const difficultyConfig = {
    easy: { label: 'Easy', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', icon: '🟢', glow: 'shadow-emerald-500/20' },
    medium: { label: 'Medium', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', icon: '🟡', glow: 'shadow-amber-500/20' },
    hard: { label: 'Hard', color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', icon: '🔴', glow: 'shadow-red-500/20' },
  };

  return (
    <div
      className="animate-fade-in relative flex flex-col min-h-screen overflow-hidden safe-bottom"
      style={{ perspective: '1200px' }}
    >
      {/* Animated floating orbs background */}
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-gradient" aria-hidden="true">
        <div className="floating-orb absolute top-[8%] left-[12%] w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: '0s' }} />
        <div className="floating-orb absolute top-[35%] right-[8%] w-80 h-80 rounded-full bg-purple-500/12 blur-3xl" style={{ animationDelay: '1.5s' }} />
        <div className="floating-orb absolute bottom-[20%] left-[20%] w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" style={{ animationDelay: '3s' }} />
        <div className="floating-orb absolute bottom-[5%] right-[25%] w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" style={{ animationDelay: '4.5s' }} />
      </div>

      {/* Main content - flex col to fill screen */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-3 sm:px-6 py-3 sm:py-6 gap-2 sm:gap-4 overflow-y-auto">

        {/* Hero Section */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="animate-float relative inline-block">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 40px rgba(34,211,238,0.15)' }}
            >
              Sudoku
            </h1>
            <div className="animate-glow-pulse absolute -inset-10 bg-gradient-to-r from-cyan-500/30 via-purple-500/35 to-cyan-500/30 blur-[80px] -z-10" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Challenge your mind with beautiful puzzles
          </p>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-sm">
          {[
            { icon: <Flame className="w-4 h-4 text-orange-400" />, value: stats.currentStreak, label: 'Streak', gradient: 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent' },
            { icon: <Trophy className="w-4 h-4 text-yellow-400" />, value: stats.gamesWon, label: 'Wins', gradient: 'bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent' },
            { icon: <Star className="w-4 h-4 text-cyan-400" />, value: stats.fastestTimes.easy === NO_TIME ? '--:--' : formatTime(stats.fastestTimes.easy), label: 'Best', gradient: 'bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent' },
            { icon: <Lightbulb className="w-4 h-4 text-purple-400" />, value: playerProgress.hints, label: 'Hints', gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card-3d glass-card rounded-xl p-2.5 sm:p-3 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {stat.icon}
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${stat.gradient}`}>{stat.value}</div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Lives & Coins & Hints - Compact inline */}
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between gap-2">
            <HintsDisplay compact={true} showAdButton={true} />
            <LivesDisplay compact={true} />
          </div>
        </div>

        {/* Daily Hint Banner */}
        {dailyHintAvailable && !hintClaimed && (
          <button
            onClick={() => {
              const success = claimDailyHint();
              if (success) setHintClaimed(true);
            }}
            className="shimmer-sweep relative card-3d btn-3d w-full max-w-sm glass-card rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300 group border-l-4 border-l-purple-400 shadow-[-4px_0_16px_rgba(168,85,247,0.3)] hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Daily Hint Available!</div>
                <div className="text-xs text-muted-foreground">
                  Claim your free +1 hint today
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>
        )}

        {hintClaimed && (
          <div className="w-full max-w-sm glass-card rounded-xl p-3 flex items-center gap-3 border border-purple-400/20">
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">💡 Daily hint claimed! +1 hint added.</span>
          </div>
        )}

        {/* === PRIMARY CTA: Play Game (Campaign) === */}
        <Button
          onClick={() => setScreen('levelMap')}
          className="btn-3d w-full max-w-sm bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg sm:text-xl py-5 sm:py-6 rounded-2xl shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:shadow-[0_0_36px_rgba(34,211,238,0.5)] transition-all duration-300 group"
        >
          <Map className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:scale-110 transition-transform" />
          Play Game
          <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Continue Game (if saved) */}
        {hasSavedGame && (
          <button
            onClick={resumeGame}
            className="shimmer-sweep relative card-3d btn-3d w-full max-w-sm glass-card rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300 group border-l-4 border-l-cyan-400 shadow-[-4px_0_16px_rgba(34,211,238,0.3)] hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Continue Game</div>
                <div className="text-xs text-muted-foreground">
                  {difficultyConfig[difficulty].label} &middot; {formatTime(timer)}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </button>
        )}

        {/* Daily Challenge - Compact */}
        <button
          onClick={handleStartDaily}
          disabled={dailyCompleted}
          className={`shimmer-sweep relative card-3d btn-3d w-full max-w-sm glass-card rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300 group border-l-4 border-l-purple-400 shadow-[-4px_0_16px_rgba(168,85,247,0.3)] ${
            dailyCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">
                {dailyCompleted ? 'Daily Complete!' : 'Daily Challenge'}
              </div>
              <div className="text-xs text-muted-foreground">
                {dailyCompleted ? 'Come back tomorrow' : "Today's medium puzzle"}
              </div>
            </div>
          </div>
          {!dailyCompleted && (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          )}
        </button>

        {/* Quick Game Mode - Separate section */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
              <h3 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Game</h3>
            </div>
            <span className="text-[9px] text-muted-foreground/50">Free play &middot; No lives used</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(difficultyConfig) as Array<'easy' | 'medium' | 'hard'>).map((diff) => {
              const config = difficultyConfig[diff];
              return (
                <button
                  key={diff}
                  onClick={() => handleStartQuickGame(diff)}
                  className={`gradient-shine-sweep btn-3d glass-card rounded-xl p-3.5 sm:p-4 bg-gradient-to-br ${config.color} border ${config.border} hover:scale-105 active:scale-95 active:shadow-sm transition-all duration-200 text-center shadow-lg ${config.glow}`}
                >
                  <div className="text-2xl mb-0.5 drop-shadow-lg">{config.icon}</div>
                  <div className="font-bold text-xs sm:text-sm">{config.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="glass-card border-t border-white/10 px-1 sm:px-2 py-1 sm:py-2.5 safe-bottom-pad">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <button
            onClick={() => setScreen('home')}
            className="flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-cyan-400 scale-105 transition-all"
          >
            <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[10px] font-medium">Home</span>
          </button>

          <button
            onClick={() => setScreen('levelMap')}
            className="flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[10px] font-medium">Levels</span>
          </button>

          <button
            onClick={() => setScreen('achievements')}
            className="flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[10px] font-medium">Awards</span>
          </button>

          <button
            onClick={() => setScreen('statistics')}
            className="flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[10px] font-medium">Stats</span>
          </button>

          <button
            onClick={handleSoundToggle}
            className={`flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/5 ${soundBounce ? 'animate-toggle-bounce' : ''}`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[8px] sm:text-[10px] font-medium">Sound</span>
          </button>

          <button
            onClick={() => setScreen('settings')}
            className="flex flex-col items-center gap-0 px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Tutorial Dialog */}
      <Dialog open={showTutorial} onOpenChange={(open) => {
        if (!open) {
          setShowTutorial(false);
          markTutorialComplete();
        }
      }}>
        <DialogContent className="glass-card border-white/15 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to Sudoku!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A quick guide to get you started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="font-semibold">Goal</div>
                  <div className="text-muted-foreground">Fill every row, column, and 3×3 box with numbers 1-9 without repeating.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🗺️</span>
                <div>
                  <div className="font-semibold">Campaign</div>
                  <div className="text-muted-foreground">Play through levels that get progressively harder. Complete a level to unlock the next one!</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🎮</span>
                <div>
                  <div className="font-semibold">Quick Game</div>
                  <div className="text-muted-foreground">Pick Easy, Medium, or Hard for a free-play session. No lives used!</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✏️</span>
                <div>
                  <div className="font-semibold">Pencil Mode</div>
                  <div className="text-muted-foreground">Toggle notes mode to jot down possible numbers in empty cells.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <div className="font-semibold">Hints</div>
                  <div className="text-muted-foreground">You start with 5 hints shared across all levels. Use them wisely — they don&apos;t refill automatically! Earn more by completing levels, watching ads, or daily rewards.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">❤️</span>
                <div>
                  <div className="font-semibold">Lives</div>
                  <div className="text-muted-foreground">You have 6 lives for campaign levels. Lose one each time you fail. They regenerate every 30 minutes!</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🪙</span>
                <div>
                  <div className="font-semibold">Coins</div>
                  <div className="text-muted-foreground">Earn coins by completing levels. Spend them to continue playing after failing!</div>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowTutorial(false);
              markTutorialComplete();
            }}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
          >
            Let&apos;s Play!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeScreen;
