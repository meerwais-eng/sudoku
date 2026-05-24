'use client';

import React from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { formatTime, NO_TIME } from '@/lib/sudoku-storage';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, Trophy, Target, Zap, Calendar } from 'lucide-react';

const StatisticsScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const stats = useSudokuStore((s) => s.stats);

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const difficulties = [
    { key: 'easy' as const, label: 'Easy', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { key: 'medium' as const, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-400' },
    { key: 'hard' as const, label: 'Hard', color: 'bg-red-500', textColor: 'text-red-400' },
  ];

  const statCards = [
    {
      icon: Target,
      label: 'Games Played',
      value: stats.gamesPlayed,
      color: 'text-cyan-400',
    },
    {
      icon: Trophy,
      label: 'Games Won',
      value: stats.gamesWon,
      color: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${winRate}%`,
      color: 'text-emerald-400',
    },
    {
      icon: Clock,
      label: 'Total Time',
      value: formatTime(stats.totalTimePlayed),
      color: 'text-purple-400',
    },
    {
      icon: Zap,
      label: 'Current Streak',
      value: stats.currentStreak,
      color: 'text-orange-400',
    },
    {
      icon: Calendar,
      label: 'Best Streak',
      value: stats.bestStreak,
      color: 'text-pink-400',
    },
  ];

  // Chart data for games by difficulty
  const maxGames = Math.max(
    stats.gamesByDifficulty.easy,
    stats.gamesByDifficulty.medium,
    stats.gamesByDifficulty.hard,
    1
  );

  return (
    <div className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 glass-card border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen('home')}
          className="h-9 w-9 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Statistics</h1>
          <p className="text-xs text-muted-foreground">Your Sudoku journey</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="glass-card rounded-xl p-3 sm:p-4">
              <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color} mb-1 sm:mb-2`} />
              <div className="text-lg sm:text-xl font-bold">{card.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Games by Difficulty Chart */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Games by Difficulty
          </h2>
          <div className="glass-card rounded-xl p-4 space-y-4">
            {difficulties.map((diff) => (
              <div key={diff.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className={`shrink-0 ${diff.textColor}`}>{diff.label}</span>
                  <span className="text-muted-foreground text-right truncate">
                    {stats.gamesByDifficulty[diff.key]} played · {stats.winsByDifficulty[diff.key]} won
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${diff.color} transition-all duration-700`}
                    style={{ width: `${(stats.gamesByDifficulty[diff.key] / maxGames) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Times by Difficulty */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Best & Average Times
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            {difficulties.map((diff) => (
              <div key={diff.key} className="p-3 sm:p-4 flex items-center justify-between">
                <span className={`font-medium shrink-0 ${diff.textColor}`}>{diff.label}</span>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Best</div>
                    <div className="font-bold text-sm">
                      {stats.fastestTimes[diff.key] === NO_TIME ? '--:--' : formatTime(stats.fastestTimes[diff.key])}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Average</div>
                    <div className="font-bold text-sm">
                      {stats.averageTimes[diff.key] === 0 ? '--:--' : formatTime(stats.averageTimes[diff.key])}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            More Stats
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Hints Used</span>
              <span className="font-bold">{stats.totalHintsUsed}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Mistakes</span>
              <span className="font-bold">{stats.totalMistakes}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily Challenges Completed</span>
              <span className="font-bold">{stats.dailyCompleted.length}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Played</span>
              <span className="font-bold text-sm">
                {stats.lastPlayedDate ? new Date(stats.lastPlayedDate).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsScreen;
