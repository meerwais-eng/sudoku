#!/bin/bash
# =====================================================
# Sudoku APK Build Script (Unix/macOS)
# Produces a signed Android Universal APK
# =====================================================
set -e

echo "============================================"
echo " Sudoku APK Build Script (Unix/macOS)"
echo " Produces a signed Android APK"
echo "============================================"
echo ""

# =====================================================
# Step 0: Validate prerequisites
# =====================================================

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is not installed. Install Node.js 18+ from https://nodejs.org/"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "ERROR: Java JDK is not installed. Install JDK 17+ from https://adoptium.net/"; exit 1; }

if [ ! -f "android/app/release.keystore" ]; then
    echo ""
    echo "ERROR: Release keystore not found at android/app/release.keystore"
    echo "You must generate it first. Run: ./scripts/generate-keystore.sh"
    echo ""
    exit 1
fi

# Check keystore password is set
KS_PASS=$(grep "^RELEASE_KEYSTORE_PASSWORD=" android/gradle.properties | cut -d'=' -f2)
if [ -z "$KS_PASS" ]; then
    echo ""
    echo "ERROR: RELEASE_KEYSTORE_PASSWORD is empty in android/gradle.properties"
    echo "Set it via environment variable or re-run ./scripts/generate-keystore.sh"
    echo ""
    exit 1
fi

echo "Prerequisites validated. Proceeding with build..."
echo ""

# =====================================================
# Step 1: Install npm dependencies
# =====================================================
echo "[1/5] Installing npm dependencies..."
npm install
echo ""

# =====================================================
# Step 2: Build Next.js static export + Capacitor sync
# =====================================================
echo "[2/5] Building Next.js static export (BUILD_TARGET=android) + Capacitor sync..."
npm run build:android
echo ""

# =====================================================
# Step 3: Generate Android mipmap icons
# =====================================================
echo "[3/5] Generating Android mipmap icons from logo.svg..."
node scripts/generate-android-icons.mjs
echo ""

# =====================================================
# Step 4: Clean Gradle cache
# =====================================================
echo "[4/5] Cleaning Gradle build cache..."
cd android
./gradlew clean || echo "WARNING: Gradle clean had issues (non-critical, continuing)"
cd ..
echo ""

# =====================================================
# Step 5: Build the signed APK
# =====================================================
echo "[5/5] Building signed Android APK..."
cd android
if ./gradlew assembleRelease; then
    cd ..
else
    echo ""
    echo "ERROR: APK build failed."
    echo "Common issues:"
    echo "  - Keystore passwords not set in gradle.properties"
    echo "  - JAVA_HOME not pointing to JDK 17+"
    echo "  - Missing Capacitor plugin dependencies"
    cd ..
    exit 1
fi

echo ""
echo "============================================"
echo "  BUILD SUCCESSFUL!"
echo "============================================"
echo ""

echo "Release APK location:"
echo "  android/app/build/outputs/apk/release/app-release.apk"
echo ""

if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    FILE_SIZE=$(stat -f%z "android/app/build/outputs/apk/release/app-release.apk" 2>/dev/null || stat -c%s "android/app/build/outputs/apk/release/app-release.apk" 2>/dev/null || echo "unknown")
    echo "File size: $FILE_SIZE bytes"
    echo ""
    echo "To install on a connected device:"
    echo "  adb install android/app/build/outputs/apk/release/app-release.apk"
    echo ""
fi

echo "To open in Android Studio for further customization:"
echo "  Open the 'android' folder in Android Studio"
echo ""