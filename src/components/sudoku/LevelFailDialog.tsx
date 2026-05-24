'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { getLevelConfig, canWatchAdForHint } from '@/lib/sudoku-storage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Coins, RotateCcw, Tv, Play, Lightbulb } from 'lucide-react';

const AD_DURATION = 5; // seconds

const LevelFailDialog: React.FC = () => {
  const currentLevel = useSudokuStore((s) => s.currentLevel);
  const playerProgress = useSudokuStore((s) => s.playerProgress);
  const showLevelFail = useSudokuStore((s) => s.showLevelFail);
  const continueWithCoins = useSudokuStore((s) => s.continueWithCoins);
  const restartLevel = useSudokuStore((s) => s.restartLevel);
  const recoverLife = useSudokuStore((s) => s.recoverLife);
  const dismissLevelFail = useSudokuStore((s) => s.dismissLevelFail);
  const regenerateLives = useSudokuStore((s) => s.regenerateLives);
  const earnHintFromAd = useSudokuStore((s) => s.earnHintFromAd);

  const config = getLevelConfig(currentLevel);
  const { lives, maxLives, coins, lastLifeLostAt, hints, lastAdHintAt } = playerProgress;
  const canAffordContinue = coins >= config.continueCost;
  const noLivesRemaining = lives === 0;
  const canWatchHintAd = canWatchAdForHint(lastAdHintAt);

  // Tick counter to drive countdown re-computation
  const [tick, setTick] = useState(0);

  // Ad-watching state for life recovery
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_DURATION);
  const [showAdSuccess, setShowAdSuccess] = useState(false);

  // Ad-watching state for hint
  const [isWatchingHintAd, setIsWatchingHintAd] = useState(false);
  const [hintAdCountdown, setHintAdCountdown] = useState(AD_DURATION);
  const [showHintAdSuccess, setShowHintAdSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Life ad countdown interval
  useEffect(() => {
    if (!isWatchingAd) return;
    if (adCountdown <= 0) return;

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatchingAd, adCountdown <= 0]);

  // Hint ad countdown interval
  useEffect(() => {
    if (!isWatchingHintAd) return;
    if (hintAdCountdown <= 0) return;

    const interval = setInterval(() => {
      setHintAdCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatchingHintAd, hintAdCountdown <= 0]);

  // When life ad countdown reaches 0, recover life and show success
  useEffect(() => {
    if (!isWatchingAd || adCountdown > 0) return;

    recoverLife();
    setShowAdSuccess(true);

    const timer = setTimeout(() => {
      setShowAdSuccess(false);
      setIsWatchingAd(false);
      setAdCountdown(AD_DURATION);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isWatchingAd, adCountdown, recoverLife]);

  // When hint ad countdown reaches 0, earn hint and show success
  useEffect(() => {
    if (!isWatchingHintAd || hintAdCountdown > 0) return;

    earnHintFromAd();
    setShowHintAdSuccess(true);

    const timer = setTimeout(() => {
      setShowHintAdSuccess(false);
      setIsWatchingHintAd(false);
      setHintAdCountdown(AD_DURATION);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isWatchingHintAd, hintAdCountdown, earnHintFromAd]);

  const handleWatchAdForLife = useCallback(() => {
    setAdCountdown(AD_DURATION);
    setIsWatchingAd(true);
    setShowAdSuccess(false);
  }, []);

  const handleWatchAdForHint = useCallback(() => {
    setHintAdCountdown(AD_DURATION);
    setIsWatchingHintAd(true);
    setShowHintAdSuccess(false);
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
    if (remaining <= 0) return '00:00';
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [tick, lastLifeLostAt, lives, maxLives]);

  // Ad progress percentages
  const adProgress = ((AD_DURATION - adCountdown) / AD_DURATION) * 100;
  const hintAdProgress = ((AD_DURATION - hintAdCountdown) / AD_DURATION) * 100;

  // Generate hearts display
  const hearts: React.ReactNode[] = [];
  for (let i = 0; i < maxLives; i++) {
    hearts.push(
      <span
        key={i}
        className={`text-xl sm:text-2xl transition-all duration-300 ${
          i < lives
            ? 'animate-[bounceIn_0.5s_ease-out] drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]'
            : 'opacity-40 grayscale'
        }`}
        style={{ animationDelay: `${i * 80}ms` }}
      >
        {i < lives ? '❤️' : '🖤'}
      </span>
    );
  }

  const isAnyAdPlaying = isWatchingAd || isWatchingHintAd;

  return (
    <Dialog open={showLevelFail} onOpenChange={(open) => { if (!open) dismissLevelFail(); }}>
      <DialogContent className="glass-card border-red-500/20 max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="text-center space-y-3">
            <div className="text-5xl sm:text-6xl">💔</div>
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-red-400">
              Level Failed!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              You made 5 mistakes
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lives display */}
          <div className="glass-card rounded-xl p-4 border border-red-500/10">
            <div className="text-xs text-muted-foreground text-center mb-2">Lives Remaining</div>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              {hearts}
            </div>

            {/* No lives warning */}
            {noLivesRemaining && (
              <div className="mt-3 text-center animate-[fadeIn_0.3s_ease-out]">
                <p className="text-red-400 font-semibold text-sm">⚠️ No lives remaining!</p>
              </div>
            )}

            {/* Next life countdown */}
            {lives < maxLives && lastLifeLostAt && (
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Next ❤️ in{' '}
                  <span className="font-mono font-bold text-cyan-400">
                    {countdown || '--:--'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Hints display - prominent */}
          <div className={`glass-card rounded-xl p-4 border ${hints > 0 ? 'border-purple-500/20' : 'border-red-500/15'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Lightbulb className={`w-6 h-6 ${hints > 0 ? 'text-purple-400' : 'text-muted-foreground/30'}`} />
                  <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[8px] font-extrabold leading-none px-0.5 ${
                    hints > 0 ? 'bg-purple-500 text-white' : 'bg-white/15 text-muted-foreground/40'
                  }`}>
                    {hints}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Hints</span>
                  <span className={`ml-1.5 font-bold text-lg tabular-nums ${hints > 0 ? 'text-purple-400' : 'text-muted-foreground/40'}`}>
                    {hints}
                  </span>
                  <span className={`text-xs ${hints > 0 ? 'text-purple-300/60' : 'text-muted-foreground/30'}`}>
                    /5
                  </span>
                </div>
              </div>
              <Button
                onClick={handleWatchAdForHint}
                disabled={!canWatchHintAd || isAnyAdPlaying}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Tv className="w-3 h-3 mr-1" />
                Watch Ad +1 💡
              </Button>
            </div>
            {hints === 0 && (
              <p className="text-[10px] text-red-400/70 mt-2 text-center">No hints remaining — earn more to get help!</p>
            )}
          </div>

          {/* Watch Ad for +1 Life (only when no lives) */}
          {noLivesRemaining && (
            <Button
              onClick={handleWatchAdForLife}
              disabled={isAnyAdPlaying}
              className="btn-3d w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Tv className="w-4 h-4 mr-2" />
              Watch Ad for +1 Life
            </Button>
          )}

          {/* Continue Playing with Coins */}
          <Button
            onClick={canAffordContinue ? continueWithCoins : undefined}
            disabled={!canAffordContinue || noLivesRemaining}
            className={`btn-3d w-full font-semibold rounded-xl py-5 transition-all duration-300 ${
              canAffordContinue && !noLivesRemaining
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]'
                : 'bg-white/5 text-muted-foreground/50 cursor-not-allowed border border-white/10'
            }`}
          >
            <Coins className="w-4 h-4 mr-2" />
            {canAffordContinue ? (
              <>
                🪙 {config.continueCost} Continue Playing
              </>
            ) : (
              <>
                🪙 {config.continueCost} — Not enough coins
              </>
            )}
          </Button>

          {/* Restart Level */}
          <Button
            onClick={restartLevel}
            disabled={noLivesRemaining}
            variant="outline"
            className={`w-full font-semibold rounded-xl py-5 transition-all duration-300 ${
              noLivesRemaining
                ? 'opacity-40 cursor-not-allowed border-white/10'
                : 'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60'
            }`}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart Level
          </Button>

          {/* Coins balance */}
          <div className="text-center text-sm text-muted-foreground">
            Your coins:{' '}
            <span className="font-bold text-amber-400">
              🪙 {coins}
            </span>
          </div>
        </div>
      </DialogContent>

      {/* Simulated Life Ad Overlay */}
      {isWatchingAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/90"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 25%, #16213e 50%, #0a2a1a 75%, #1a0a2e 100%)',
              backgroundSize: '400% 400%',
              animation: 'adGradientShift 3s ease infinite',
            }}
          />

          <style jsx>{`
            @keyframes adGradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes adPulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
            @keyframes adGlow {
              0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.2), 0 0 60px rgba(34, 211, 238, 0.1); }
              50% { box-shadow: 0 0 30px rgba(34, 211, 238, 0.4), 0 0 80px rgba(34, 211, 238, 0.2); }
            }
            @keyframes successPop {
              0% { transform: scale(0.5); opacity: 0; }
              60% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div
            className="glass-card relative z-10 rounded-2xl p-8 sm:p-10 max-w-xs sm:max-w-sm w-full mx-4 text-center space-y-6 border border-white/10"
            style={{ animation: 'adGlow 2s ease-in-out infinite' }}
          >
            {!showAdSuccess ? (
              <>
                <div className="flex justify-center">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center"
                    style={{ animation: 'adPulse 1.5s ease-in-out infinite' }}
                  >
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 fill-cyan-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Watching Ad...
                  </h3>
                  <p className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400 tabular-nums">
                    {adCountdown}
                  </p>
                </div>

                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${adProgress}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground/60">
                  Please wait, ad playing...
                </p>
              </>
            ) : (
              <div
                className="space-y-4 py-4"
                style={{ animation: 'successPop 0.5s ease-out' }}
              >
                <div className="text-5xl sm:text-6xl">❤️</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  +1 Life Recovered!
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulated Hint Ad Overlay */}
      {isWatchingHintAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/90"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #2a0a3e 25%, #261350 50%, #1a0a3e 75%, #2a0a2e 100%)',
              backgroundSize: '400% 400%',
              animation: 'adGradientShift 3s ease infinite',
            }}
          />

          <style jsx>{`
            @keyframes adGradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes adPulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
            @keyframes adGlow {
              0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.2), 0 0 60px rgba(168, 85, 247, 0.1); }
              50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.2); }
            }
            @keyframes successPop {
              0% { transform: scale(0.5); opacity: 0; }
              60% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div
            className="glass-card relative z-10 rounded-2xl p-8 sm:p-10 max-w-xs sm:max-w-sm w-full mx-4 text-center space-y-6 border border-purple-500/20"
            style={{ animation: 'adGlow 2s ease-in-out infinite' }}
          >
            {!showHintAdSuccess ? (
              <>
                <div className="flex justify-center">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center"
                    style={{ animation: 'adPulse 1.5s ease-in-out infinite' }}
                  >
                    <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Watching Ad...
                  </h3>
                  <p className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-400 tabular-nums">
                    {hintAdCountdown}
                  </p>
                </div>

                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${hintAdProgress}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground/60">
                  Earning a hint — please wait...
                </p>
              </>
            ) : (
              <div
                className="space-y-4 py-4"
                style={{ animation: 'successPop 0.5s ease-out' }}
              >
                <div className="text-5xl sm:text-6xl">💡</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-400">
                  +1 Hint Earned!
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default LevelFailDialog;
