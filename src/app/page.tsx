'use client';

import React, { useEffect } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { initializeAdMob, setupInterstitialListeners, setupRewardAdListeners } from '@/lib/admob-service';
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
  const goBack = useSudokuStore((s) => s.goBack);
  const showExitConfirm = useSudokuStore((s) => s.showExitConfirm);
  const dismissExitConfirm = useSudokuStore((s) => s.dismissExitConfirm);
  const confirmExit = useSudokuStore((s) => s.confirmExit);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize AdMob and set up ad listeners on mount
  useEffect(() => {
    initializeAdMob().then(() => {
      setupInterstitialListeners();
      setupRewardAdListeners();
    });
  }, []);

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Expose store on window for native Android back-press handler access
  useEffect(() => {
    (window as any).__sudokuStore = useSudokuStore;

    // CRITICAL: Register __sudokuHandleBackPress so the native Android WebView
    // can call goBack() via the JS bridge. Without this, the native side falls
    // back to SudokuAndroid.requestExitDialog() which shows a native AlertDialog
    // with potentially invisible buttons on dark-themed devices.
    (window as any).__sudokuHandleBackPress = () => {
      const store = (window as any).__sudokuStore;
      if (store && store.getState) {
        store.getState().goBack();
      } else if ((window as any).SudokuAndroid?.requestExitDialog) {
        (window as any).SudokuAndroid.requestExitDialog();
      }
    };
  }, []);

  // Android back button handler
  // CRITICAL: On native Android (Capacitor), the backButton event intercepts
  // the hardware back press at the native level. If we also listen for popstate,
  // BOTH handlers fire on a single back press, causing goBack() to be called twice.
  // Fix: Use Capacitor handler exclusively on native; use popstate only for web/PWA.
  // Also add a debounce guard to prevent double-invocation from any source.
  useEffect(() => {
    const Capacitor = (window as any).Capacitor;
    const isNative = Capacitor?.isNativePlatform?.();

    // Debounce guard: prevent goBack() from being called twice within 300ms
    // (e.g., if both Capacitor and popstate somehow fire, or listener re-registration)
    let lastBackTime = 0;
    const debouncedGoBack = () => {
      const now = Date.now();
      if (now - lastBackTime < 300) return; // Skip duplicate call
      lastBackTime = now;
      goBack();
    };

    if (isNative) {
      // Native Android: Use modern @capacitor/app plugin API if available,
      // fall back to legacy Capacitor.Plugins.App if not.
      // The backButton event intercepts the hardware back press at native level.
      const handleBackButton = (e: any) => {
        e.preventDefault();
        debouncedGoBack();
      };

      let listenerHandle: any = null;

      // Try modern Capacitor App plugin first (imported via @capacitor/app)
      const AppPlugin = (window as any).Capacitor?.Plugins?.App;
      if (AppPlugin) {
        AppPlugin.addListener('backButton', handleBackButton).then((handle: any) => {
          listenerHandle = handle;
        }).catch(() => {
          // Fallback: try removeListener approach if addListener fails
          try { AppPlugin.addListener('backButton', handleBackButton); } catch {}
        });
      }

      return () => {
        // Use the handle's .remove() method (Capacitor 3+ API) for proper cleanup
        if (listenerHandle) {
          listenerHandle.remove();
        } else {
          // Fallback: if promise hasn't resolved yet, try removeListener
          try {
            const AppPlugin = (window as any).Capacitor?.Plugins?.App;
            if (AppPlugin) AppPlugin.removeListener('backButton', handleBackButton);
          } catch {}
        }
      };
    } else {
      // Web / PWA: Use popstate for back navigation.
      // Re-push state after each popstate so subsequent back presses also work.
      const handlePopState = () => {
        debouncedGoBack();
        window.history.pushState(null, '', window.location.href);
      };

      // Push initial state so first back press triggers popstate
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [goBack]);

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

      {/* Inject exit dialog animation keyframes dynamically so they're
          guaranteed to exist regardless of CSS bundle order. Without these,
          the "fill-mode: both" on undefined keyframes keeps the entire
          dialog (including Yes/No buttons) at opacity 0 — invisible. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes exitOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes exitDialogZoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      ` }} />

      {/* Exit confirmation dialog — uses inline animation styles instead of
          animate-in/fade-in/zoom-in-95 classes because tw-animate-css's
          --tw-enter-opacity:0 initial state can render the entire dialog
          (including buttons) invisible on Android WebView. Inline keyframes
          guarantee visibility in all WebView versions. */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
             style={{
               backgroundColor: 'rgba(0, 0, 0, 0.6)',
               backdropFilter: 'blur(4px)',
               WebkitBackdropFilter: 'blur(4px)',
               animation: 'exitOverlayFadeIn 0.2s ease-out both',
             }}>
          <div className="p-6 rounded-2xl max-w-sm mx-4 text-center"
               style={{
                 backgroundColor: 'rgba(30, 30, 40, 0.95)',
                 backdropFilter: 'blur(16px)',
                 WebkitBackdropFilter: 'blur(16px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                 animation: 'exitDialogZoomIn 0.2s ease-out both',
               }}>
            <div className="text-3xl mb-3">🚪</div>
            <h2 className="text-xl font-bold mb-2 text-white">Exit Game?</h2>
            <p className="text-white/70 mb-6">Do you want to exit the game?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={dismissExitConfirm}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm active:scale-95"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  minWidth: '80px',
                }}
              >
                No
              </button>
              <button
                onClick={confirmExit}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm active:scale-95"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  minWidth: '80px',
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}