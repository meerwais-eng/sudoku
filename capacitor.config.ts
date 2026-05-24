import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sudoku.premium',
  appName: 'Sudoku',
  webDir: 'out',
  server: {
    // No live-reload URL — app runs from local files
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d1117',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0d1117',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'android/app/release.keystore',
      keystoreAlias: 'sudoku',
    },
    allowMixedContent: false,
    // Enable proper WebView rendering for mobile
    webContentsDebuggingEnabled: false,
  },
};

export default config;
