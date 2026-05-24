'use client';

import React, { useEffect } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import HomeScreen from '@/components/sudoku/HomeScreen';
import GameScreen from '@/components/sudoku/GameScreen';
import AchievementsScreen from '@/components/sudoku/AchievementsScreen';
import LeaderboardScreen from '@/components/sudoku/LeaderboardScreen';
import StatisticsScreen from '@/components/sudoku/StatisticsScreen';
import SettingsScreen from '@/components/sudoku/SettingsScreen';
import AuthScreen from '@/components/sudoku/AuthScreen';
import LevelMapScreen from '@/components/sudoku/LevelMapScreen';
import InstallPrompt from '@/components/sudoku/InstallPrompt';

export default function Home() {
  const currentScreen = useSudokuStore((s) => s.currentScreen);
  const initialize = useSudokuStore((s) => s.initialize);
  const settings = useSudokuStore((s) => s.settings);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'levelMap':
        return <LevelMapScreen />;
      case 'game':
        return <GameScreen />;
      case 'achievements':
        return <AchievementsScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'statistics':
        return <StatisticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'auth':
        return <AuthScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {renderScreen()}
      <InstallPrompt />
    </div>
  );
}
