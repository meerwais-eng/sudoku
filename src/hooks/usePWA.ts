'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  swRegistered: boolean;
  hasUpdate: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function getIsOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

function detectPlatform(): { isIOS: boolean; isAndroid: boolean } {
  if (typeof window === 'undefined') return { isIOS: false, isAndroid: false };
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/.test(ua);
  return { isIOS, isAndroid };
}

export function usePWA() {
  const [state, setState] = useState<PWAState>(() => ({
    isInstallable: false,
    isInstalled: getIsStandalone(),
    isOffline: getIsOffline(),
    swRegistered: false,
    hasUpdate: false,
    isIOS: false,
    isAndroid: false,
  }));

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Detect platform
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { isIOS, isAndroid } = detectPlatform();
    setState((prev) => ({ ...prev, isIOS, isAndroid }));
  }, []);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration.scope);
        setState((prev) => ({ ...prev, swRegistered: true }));

        // Check for updates periodically (every 30 minutes)
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('[PWA] New content available');
                setState((prev) => ({ ...prev, hasUpdate: true }));
              }
            });
          }
        });

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            console.log('[PWA] SW updated to:', event.data.version);
            setState((prev) => ({ ...prev, hasUpdate: true }));
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  // Listen for beforeinstallprompt (Android/Chrome only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setState((prev) => ({ ...prev, isInstallable: true }));
      console.log('[PWA] Install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setState((prev) => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Listen for online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setState((prev) => ({
        ...prev,
        isOffline: !navigator.onLine,
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Trigger install prompt (Chrome/Android)
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      setDeferredPrompt(null);
      setState((prev) => ({ ...prev, isInstallable: false }));
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Apply SW update — tell the waiting SW to skip waiting, then reload
  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
      // Reload after a short delay to let the new SW take over
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    setState((prev) => ({ ...prev, hasUpdate: false }));
  }, []);

  // Check if a specific feature requires internet
  const requiresInternet = useCallback((feature: string): boolean => {
    if (!state.isOffline) return false;
    const offlineFeatures = ['game', 'home', 'levelMap', 'settings', 'statistics', 'achievements'];
    return !offlineFeatures.includes(feature);
  }, [state.isOffline]);

  return {
    ...state,
    installApp,
    applyUpdate,
    requiresInternet,
  };
}
