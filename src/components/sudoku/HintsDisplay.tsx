'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { canClaimDailyHint, canWatchAdForHint } from '@/lib/sudoku-storage';
import { showRewardAd, prepareRewardAd, isNativePlatform } from '@/lib/admob-service';
import { Lightbulb, Tv } from 'lucide-react';

interface HintsDisplayProps {
  /** Compact mode: smaller icons, used in top bar / header */
  compact?: boolean;
  /** Show watch-ad button when hints are 0 */
  showAdButton?: boolean;
}

const HintsDisplay: React.FC<HintsDisplayProps> = ({ compact = false, showAdButton = false }) => {
  const playerProgress = useSudokuStore((s) => s.playerProgress);
  const claimDailyHint = useSudokuStore((s) => s.claimDailyHint);
  const earnHintFromAd = useSudokuStore((s) => s.earnHintFromAd);

  const { hints, lastDailyHintAt, lastAdHintAt } = playerProgress;
  const dailyHintAvailable = canClaimDailyHint(lastDailyHintAt);
  const canWatchAd = canWatchAdForHint(lastAdHintAt);
  const hasHints = hints > 0;

  // Simulated ad watching
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showAdSuccess, setShowAdSuccess] = useState(false);

  useEffect(() => {
    if (!isWatchingAd || adCountdown <= 0) return;
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

  useEffect(() => {
    if (!isWatchingAd || adCountdown > 0) return;

    // Use setTimeout to avoid calling setState synchronously in effect
    const successTimer = setTimeout(() => {
      earnHintFromAd();
      setShowAdSuccess(true);
    }, 0);

    const resetTimer = setTimeout(() => {
      setShowAdSuccess(false);
      setIsWatchingAd(false);
      setAdCountdown(5);
    }, 1000);

    return () => {
      clearTimeout(successTimer);
      clearTimeout(resetTimer);
    };
  }, [isWatchingAd, adCountdown, earnHintFromAd]);

  const adProgress = ((5 - adCountdown) / 5) * 100;

  // Pre-warm reward ad for native
  useEffect(() => {
    if (isNativePlatform()) {
      prepareRewardAd();
    }
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (isNativePlatform()) {
      // Native Android: use real AdMob rewarded ad
      const shown = await showRewardAd(() => {
        earnHintFromAd();
        setShowAdSuccess(true);
        setTimeout(() => {
          setShowAdSuccess(false);
        }, 2000);
      });

      if (!shown) {
        // Fallback: if ad wasn't ready, try to prepare and show notification
        console.warn('[HintsDisplay] Reward ad not ready, preparing...');
        prepareRewardAd();
      }
    } else {
      // Web/PWA: use simulated ad (no real AdMob on web)
      setAdCountdown(5);
      setIsWatchingAd(true);
      setShowAdSuccess(false);
    }
  }, [earnHintFromAd]);

  return (
    <>
      <div className={`flex items-center gap-1.5 ${compact ? 'gap-1' : 'gap-2'}`}>
        {/* Hints icon + count */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-300 ${
            hasHints
              ? 'bg-purple-500/10 border-purple-500/25'
              : 'bg-white/[0.03] border-white/10 opacity-60'
          } ${dailyHintAvailable ? 'cursor-pointer hover:scale-105 hover:bg-purple-500/15' : ''}`}
          onClick={() => {
            if (dailyHintAvailable) {
              claimDailyHint();
            }
          }}
          title={dailyHintAvailable ? 'Claim your daily hint!' : `Hints: ${hints} remaining`}
        >
          <div className="relative">
            <Lightbulb
              className={`transition-all duration-300 ${
                compact ? 'w-4 h-4' : 'w-5 h-5'
              } ${
                hasHints
                  ? 'text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]'
                  : 'text-muted-foreground/30'
              } ${dailyHintAvailable ? 'animate-pulse' : ''}`}
            />
            {/* Count badge */}
            <span
              className={`absolute -top-1.5 -right-2 min-w-[13px] h-[13px] flex items-center justify-center rounded-full text-[7px] font-extrabold leading-none px-0.5 transition-all duration-300 ${
                hasHints
                  ? 'bg-purple-500 text-white shadow-[0_0_4px_rgba(168,85,247,0.5)]'
                  : 'bg-white/15 text-muted-foreground/40'
              }`}
            >
              {hints}
            </span>
          </div>
          {!compact && (
            <span
              className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
                hasHints ? 'text-purple-400' : 'text-muted-foreground/40'
              }`}
            >
              {hints}<span className="text-xs text-muted-foreground/40">/5</span>
            </span>
          )}
          {dailyHintAvailable && (
            <span className="text-[7px] font-bold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded border border-emerald-400/20 animate-pulse whitespace-nowrap">
              +1
            </span>
          )}
        </div>

        {/* Watch Ad for hint button (always available when adButton is shown) */}
        {showAdButton && canWatchAd && !isWatchingAd && (
          <button
            onClick={handleWatchAd}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/25 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:text-purple-200 transition-all duration-200 ${compact ? 'px-1.5 py-0.5' : ''}`}
            title="Watch a short ad to earn +1 hint"
          >
            <Tv className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>+1💡</span>
          </button>
        )}
        {!canWatchAd && showAdButton && (
          <span className="text-[9px] text-muted-foreground/30">Ad cooldown...</span>
        )}
      </div>

      {/* Ad success notification (for native rewarded ad) */}
      {showAdSuccess && isNativePlatform() && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="glass-card rounded-xl px-4 py-3 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <span className="text-sm font-semibold text-purple-300">
              +1 Hint Earned!
            </span>
          </div>
        </div>
      )}

      {/* Simulated Ad Overlay for earning hint (web/PWA only) */}
      {isWatchingAd && !isNativePlatform() && (
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
            {!showAdSuccess ? (
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
                    {adCountdown}
                  </p>
                </div>

                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${adProgress}%` }}
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
    </>
  );
};

export default HintsDisplay;
