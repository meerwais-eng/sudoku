'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { Coins } from 'lucide-react';

interface LivesDisplayProps {
  /** Compact mode: smaller hearts, used in top bar */
  compact?: boolean;
  /** Mini mode: shows "❤️N/M" text instead of individual hearts — saves horizontal space */
  mini?: boolean;
}

const LivesDisplay: React.FC<LivesDisplayProps> = ({ compact = false, mini = false }) => {
  const playerProgress = useSudokuStore((s) => s.playerProgress);
  const regenerateLives = useSudokuStore((s) => s.regenerateLives);

  const { lives, maxLives, lastLifeLostAt, coins } = playerProgress;

  // Tick counter to drive countdown re-computation
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // When tick hits and timer reaches zero, regenerate lives
  useEffect(() => {
    if (!lastLifeLostAt || lives >= maxLives) return;
    const lostAt = new Date(lastLifeLostAt).getTime();
    const REGEN_INTERVAL_MS = 30 * 60 * 1000;
    const remaining = lostAt + REGEN_INTERVAL_MS - Date.now();
    if (remaining <= 0) {
      regenerateLives();
    }
  }, [tick, lastLifeLostAt, lives, maxLives, regenerateLives]);

  // Compute countdown string from current time
  const countdown = useMemo(() => {
    if (!lastLifeLostAt || lives >= maxLives) return '';
    const lostAt = new Date(lastLifeLostAt).getTime();
    const REGEN_INTERVAL_MS = 30 * 60 * 1000;
    const remaining = lostAt + REGEN_INTERVAL_MS - Date.now();
    if (remaining <= 0) return '';
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [tick, lastLifeLostAt, lives, maxLives]);

  // Mini mode: compact text display "❤️N/M" — no individual hearts, no coins
  if (mini) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-none">
          {lives > 0 ? '❤️' : '🖤'}
        </span>
        <span className={`font-bold tabular-nums leading-none ${lives > 0 ? 'text-red-400' : 'text-muted-foreground/40'}`}>
          {lives}/{maxLives}
        </span>
        {lives < maxLives && lastLifeLostAt && countdown && (
          <span className="text-[9px] text-muted-foreground tabular-nums font-mono">
            <span className="font-bold text-cyan-400">{countdown}</span>
          </span>
        )}
        <div className="flex items-center gap-0.5 ml-1">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="font-bold text-amber-400 tabular-nums text-[10px]">
            {coins}
          </span>
        </div>
      </div>
    );
  }

  // Generate hearts
  const hearts: React.ReactNode[] = [];
  for (let i = 0; i < maxLives; i++) {
    const heartSize = compact ? 'text-sm' : 'text-base sm:text-lg';
    hearts.push(
      <span
        key={i}
        className={`${heartSize} leading-none transition-all duration-300 ${
          i < lives
            ? 'drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]'
            : 'opacity-30 grayscale'
        }`}
      >
        {i < lives ? '❤️' : '🖤'}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {/* Hearts row */}
      <div className="flex items-center gap-0.5">
        {hearts}
      </div>

      {/* Countdown timer */}
      {lives < maxLives && lastLifeLostAt && countdown && (
        <span className={`text-muted-foreground tabular-nums ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Next ❤️{' '}
          <span className="font-mono font-bold text-cyan-400">
            {countdown}
          </span>
        </span>
      )}

      {/* Coin counter */}
      <div className={`flex items-center gap-1 ${compact ? 'ml-1' : 'ml-2'}`}>
        <Coins className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-400`} />
        <span className={`font-bold text-amber-400 tabular-nums ${compact ? 'text-xs' : 'text-sm'}`}>
          {coins}
        </span>
      </div>
    </div>
  );
};

export default LivesDisplay;
