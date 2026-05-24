'use client';

import React from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { formatTime } from '@/lib/sudoku-storage';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Clock, Medal } from 'lucide-react';

const LeaderboardScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const leaderboard = useSudokuStore((s) => s.leaderboard);

  const easyEntries = leaderboard.filter((e) => e.difficulty === 'easy').slice(0, 10);
  const mediumEntries = leaderboard.filter((e) => e.difficulty === 'medium').slice(0, 10);
  const hardEntries = leaderboard.filter((e) => e.difficulty === 'hard').slice(0, 10);

  const sections = [
    { label: 'Easy', entries: easyEntries, color: 'text-emerald-400', icon: '🟢' },
    { label: 'Medium', entries: mediumEntries, color: 'text-amber-400', icon: '🟡' },
    { label: 'Hard', entries: hardEntries, color: 'text-red-400', icon: '🔴' },
  ];

  const getMedalIcon = (index: number) => {
    if (index === 0) return <span className="text-lg">🥇</span>;
    if (index === 1) return <span className="text-lg">🥈</span>;
    if (index === 2) return <span className="text-lg">🥉</span>;
    return <span className="text-sm text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

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
          <h1 className="text-lg font-bold">Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Your personal best times</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{section.icon}</span>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </h2>
            </div>

            {section.entries.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Star className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No times yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Complete a puzzle to see your time here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {section.entries.map((entry, index) => (
                  <div
                    key={`${entry.date}-${index}`}
                    className={`glass-card rounded-lg p-3 flex items-center gap-3 ${
                      index === 0 ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/5 border-cyan-500/20' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      {getMedalIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={`font-bold ${section.color}`}>{formatTime(entry.time)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(entry.date).toLocaleDateString()} · {entry.mistakes} mistake{entry.mistakes !== 1 ? 's' : ''} · {entry.hintsUsed} hint{entry.hintsUsed !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
