'use client';

import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

// ============================================================
// Ad Unit IDs
// ============================================================

/** Footer banner ad - Native advanced (shown as bottom banner) */
export const AD_UNIT_FOOTER = 'ca-app-pub-8125258580957558/7199564241';

/** Interval interstitial ad */
export const AD_UNIT_INTERVAL = 'ca-app-pub-8125258580957558/6883574322';

/** Rewarded ad for earning hints */
export const AD_UNIT_REWARD = 'ca-app-pub-8125258580957558/1631247649';

// ============================================================
// AdMob Service
// ============================================================

let initialized = false;
let footerBannerShown = false;

/**
 * Initialize AdMob with the app's ad units.
 * Must be called once on app startup (client-side only).
 */
export async function initializeAdMob(): Promise<void> {
  if (initialized) return;

  try {
    await AdMob.initialize({
      // Testing devices: add your test device ID here during development
      // testingDevices: ['YOUR_TEST_DEVICE_ID'],
      // initializeForTesting: true,
      maxAdContentRating: 'General' as any,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    initialized = true;
    console.log('[AdMob] Initialized successfully');
  } catch (error) {
    console.error('[AdMob] Initialization failed:', error);
  }
}

// ============================================================
// Footer Banner Ad (Native Advanced)
// ============================================================

/**
 * Show the footer banner ad at the bottom of the screen.
 * This is the "Footer" ad unit (native advanced format shown as adaptive banner).
 * Call this when the game screen is active.
 */
export async function showFooterBanner(): Promise<void> {
  if (!initialized) {
    console.warn('[AdMob] Cannot show footer banner: AdMob not initialized');
    return;
  }

  try {
    await AdMob.showBanner({
      adId: AD_UNIT_FOOTER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    footerBannerShown = true;
    console.log('[AdMob] Footer banner shown');
  } catch (error) {
    console.error('[AdMob] Failed to show footer banner:', error);
  }
}

/**
 * Hide the footer banner ad.
 * Call this when leaving the game screen.
 */
export async function hideFooterBanner(): Promise<void> {
  if (!footerBannerShown) return;

  try {
    await AdMob.hideBanner();
    footerBannerShown = false;
    console.log('[AdMob] Footer banner hidden');
  } catch (error) {
    console.error('[AdMob] Failed to hide footer banner:', error);
  }
}

/**
 * Remove the footer banner completely.
 */
export async function removeFooterBanner(): Promise<void> {
  try {
    await AdMob.removeBanner();
    footerBannerShown = false;
    console.log('[AdMob] Footer banner removed');
  } catch (error) {
    console.error('[AdMob] Failed to remove footer banner:', error);
  }
}

// ============================================================
// Interstitial Ad (Interval)
// ============================================================

let interstitialPrepared = false;
let interstitialLoading = false;

/**
 * Prepare an interstitial ad for later display.
 * Call this in advance so the ad is ready when needed.
 */
export async function prepareInterstitial(): Promise<void> {
  if (!initialized || interstitialLoading) return;

  interstitialLoading = true;
  try {
    await AdMob.prepareInterstitial({
      adId: AD_UNIT_INTERVAL,
    });
    interstitialPrepared = true;
    console.log('[AdMob] Interstitial prepared');
  } catch (error) {
    console.error('[AdMob] Failed to prepare interstitial:', error);
    interstitialPrepared = false;
  } finally {
    interstitialLoading = false;
  }
}

/**
 * Show the interstitial ad if it's ready.
 * Returns true if the ad was shown, false otherwise.
 * After showing, automatically prepares the next one.
 */
export async function showInterstitialAd(): Promise<boolean> {
  if (!initialized || !interstitialPrepared) return false;

  try {
    await AdMob.showInterstitial();
    interstitialPrepared = false;
    console.log('[AdMob] Interstitial shown');

    // Prepare next interstitial after a short delay
    setTimeout(() => {
      prepareInterstitial();
    }, 2000);

    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show interstitial:', error);
    // Try to prepare again
    interstitialPrepared = false;
    prepareInterstitial();
    return false;
  }
}

/**
 * Set up interstitial listeners to auto-prepare after dismissal.
 */
export function setupInterstitialListeners(): void {
  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    console.log('[AdMob] Interstitial dismissed, preparing next...');
    prepareInterstitial();
  });

  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
    console.error('[AdMob] Interstitial failed to load:', error);
    interstitialPrepared = false;
    // Retry after a delay
    setTimeout(() => {
      prepareInterstitial();
    }, 10000);
  });
}

// ============================================================
// Rewarded Ad (Reward - 1 Hint)
// ============================================================

let rewardAdPrepared = false;
let rewardAdLoading = false;
let rewardAdCallback: (() => void) | null = null;

/**
 * Prepare a rewarded video ad.
 * Call this in advance so the ad is ready when the user wants a hint.
 */
export async function prepareRewardAd(): Promise<void> {
  if (!initialized || rewardAdLoading) return;

  rewardAdLoading = true;
  try {
    await AdMob.prepareRewardVideoAd({
      adId: AD_UNIT_REWARD,
    });
    rewardAdPrepared = true;
    console.log('[AdMob] Reward ad prepared');
  } catch (error) {
    console.error('[AdMob] Failed to prepare reward ad:', error);
    rewardAdPrepared = false;
  } finally {
    rewardAdLoading = false;
  }
}

/**
 * Show the rewarded video ad.
 * @param onRewardEarned Callback invoked when the user earns the reward (1 hint)
 * @returns true if the ad was shown, false otherwise
 */
export async function showRewardAd(onRewardEarned: () => void): Promise<boolean> {
  if (!initialized || !rewardAdPrepared) return false;

  rewardAdCallback = onRewardEarned;

  try {
    const reward = await AdMob.showRewardVideoAd();
    console.log('[AdMob] Reward ad completed, reward:', reward);
    // The rewarded callback is handled in setupRewardAdListeners via the 'rewarded' event
    rewardAdPrepared = false;

    // Prepare next reward ad after a short delay
    setTimeout(() => {
      prepareRewardAd();
    }, 2000);

    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show reward ad:', error);
    rewardAdCallback = null;
    rewardAdPrepared = false;
    prepareRewardAd();
    return false;
  }
}

/**
 * Set up rewarded ad listeners for lifecycle events.
 */
export function setupRewardAdListeners(): void {
  AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
    console.log('[AdMob] Reward earned:', reward);
    // Invoke the callback to grant the hint
    if (rewardAdCallback) {
      rewardAdCallback();
      rewardAdCallback = null;
    }
  });

  AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
    console.log('[AdMob] Reward ad dismissed');
    // If callback wasn't called (user dismissed without completing), clear it
    if (rewardAdCallback) {
      console.log('[AdMob] Reward ad dismissed without earning reward');
      rewardAdCallback = null;
    }
    prepareRewardAd();
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
    console.error('[AdMob] Reward ad failed to load:', error);
    rewardAdPrepared = false;
    setTimeout(() => {
      prepareRewardAd();
    }, 10000);
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
    console.error('[AdMob] Reward ad failed to show:', error);
    rewardAdCallback = null;
    rewardAdPrepared = false;
    prepareRewardAd();
  });
}

// ============================================================
// Check if running on native platform
// ============================================================

/**
 * Check if the app is running as a native Android app (Capacitor).
 * On web/PWA, ads won't be available.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const Capacitor = (window as any).Capacitor;
  return Capacitor?.isNativePlatform?.() ?? false;
}