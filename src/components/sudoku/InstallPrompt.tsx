'use client';

import React, { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Download, WifiOff, X, Smartphone, RefreshCw, Share, ChevronRight } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isOffline, installApp, hasUpdate, applyUpdate, isIOS } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show install prompt after a brief delay (only if not dismissed)
  useEffect(() => {
    if (dismissed) return;
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
    // On iOS, show the guide prompt if not installed
    if (isIOS && !isInstalled) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInstallable, isInstalled, isIOS, dismissed]);

  // Show update banner when update is available
  useEffect(() => {
    if (hasUpdate) {
      setShowUpdateBanner(true);
    }
  }, [hasUpdate]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const accepted = await installApp();
    if (accepted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for 7 days
    try {
      localStorage.setItem('sudoku-install-dismissed', Date.now().toString());
    } catch { /* ignore */ }
  };

  // Check if previously dismissed
  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem('sudoku-install-dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          setDismissed(true);
        } else {
          localStorage.removeItem('sudoku-install-dismissed');
        }
      }
    } catch { /* ignore */ }
  }, []);

  const visible = showPrompt && !isInstalled && (isInstallable || (isIOS && !isInstalled));

  return (
    <>
      {/* ===== Offline Banner ===== */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[60] animate-slide-down">
          <div className="bg-amber-500/95 backdrop-blur-sm text-amber-950 text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
            <WifiOff className="w-4 h-4" />
            <span>You're offline — core features still available</span>
          </div>
        </div>
      )}

      {/* ===== Update Available Banner ===== */}
      {showUpdateBanner && hasUpdate && (
        <div className="fixed top-0 left-0 right-0 z-[55] animate-slide-down">
          <div className="bg-cyan-500/95 backdrop-blur-sm text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20">
            <RefreshCw className="w-4 h-4" />
            <span>Update available — new features & fixes</span>
            <button
              onClick={() => { applyUpdate(); setShowUpdateBanner(false); }}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Dismiss update"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===== Install Prompt (Android/Chrome) ===== */}
      {visible && !isIOS && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
          <div className="glass-card max-w-lg mx-auto rounded-2xl p-4 flex items-center gap-3 border border-cyan-400/20 shadow-xl shadow-cyan-500/10">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                Install Sudoku Prime
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Play offline, faster access, no browser bar
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="btn-3d px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:from-cyan-400 hover:to-cyan-500 transition-all"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Install Prompt (iOS) ===== */}
      {visible && isIOS && !showIOSGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
          <div className="glass-card max-w-lg mx-auto rounded-2xl p-4 flex items-center gap-3 border border-cyan-400/20 shadow-xl shadow-cyan-500/10">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                Install Sudoku Prime
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to Home Screen for offline play
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="btn-3d px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:from-cyan-400 hover:to-cyan-500 transition-all"
              >
                How to Install
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== iOS Install Guide Modal ===== */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-sm w-full rounded-2xl p-6 border border-cyan-400/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Install on iPhone/iPad
              </h3>
              <button
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Tap the <strong>Share button</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    It's at the bottom of the browser — the square with an arrow pointing up
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-cyan-400">
                    <Share className="w-5 h-5" />
                    <span className="text-xs font-medium">Share icon</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Look for the plus icon (+) in the share menu options
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Tap <strong>"Add"</strong> to confirm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The app icon will appear on your home screen — no browser bar, full offline support!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
              <p className="text-xs text-cyan-300 text-center">
                🧩 Sudoku Prime works fully offline once installed — play anywhere, anytime!
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-cyan-500 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;
