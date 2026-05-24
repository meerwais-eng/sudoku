'use client';

import React from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';

const AchievementsScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const achievements = useSudokuStore((s) => s.achievements);

  const categories = [
    { key: 'solving', label: '🧩 Solving', color: 'from-cyan-500/10 to-cyan-600/5' },
    { key: 'speed', label: '⚡ Speed', color: 'from-amber-500/10 to-amber-600/5' },
    { key: 'streak', label: '🔥 Streak', color: 'from-orange-500/10 to-orange-600/5' },
    { key: 'mastery', label: '👑 Mastery', color: 'from-purple-500/10 to-purple-600/5' },
  ] as const;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

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
          <h1 className="text-lg font-bold">Achievements</h1>
          <p className="text-xs text-muted-foreground">{unlockedCount}/{totalCount} Unlocked</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {categories.map((category) => {
          const categoryAchievements = achievements.filter((a) => a.category === category.key);
          if (categoryAchievements.length === 0) return null;

          return (
            <div key={category.key}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`glass-card rounded-xl p-4 transition-all duration-300 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/20'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          achievement.unlocked ? 'bg-white/10' : 'bg-white/5'
                        }`}
                      >
                        {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground/50" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{achievement.description}</div>
                        {achievement.target > 1 && (
                          <div className="mt-2">
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  achievement.unlocked
                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                                    : 'bg-cyan-500/50'
                                }`}
                                style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {achievement.progress}/{achievement.target}
                            </div>
                          </div>
                        )}
                        {achievement.unlockedAt && (
                          <div className="text-[10px] text-cyan-400 mt-1">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsScreen;
