#!/bin/bash
# =====================================================
# Sudoku AAB Build Script (Unix/macOS)
# Produces a signed Android App Bundle
# =====================================================
set -e

echo "============================================"
echo " Sudoku AAB Build Script (Unix/macOS)"
echo " Produces a signed Android App Bundle"
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
echo "[1/6] Installing npm dependencies..."
npm install
echo ""

# =====================================================
# Step 2: Build Next.js static export
# =====================================================
echo "[2/6] Building Next.js static export (BUILD_TARGET=android)..."
npm run build:android
echo ""

# =====================================================
# Step 3: Generate Android mipmap icons
# =====================================================
echo "[3/6] Generating Android mipmap icons from logo.svg..."
node scripts/generate-android-icons.mjs
echo ""

# =====================================================
# Step 4: Sync Capacitor
# =====================================================
echo "[4/6] Syncing Capacitor (copy web assets + plugins)..."
npx cap sync android
echo ""

# =====================================================
# Step 5: Clean Gradle cache
# =====================================================
echo "[5/6] Cleaning Gradle build cache..."
cd android
./gradlew clean || echo "WARNING: Gradle clean had issues (non-critical, continuing)"
cd ..
echo ""

# =====================================================
# Step 6: Build the signed AAB
# =====================================================
echo "[6/6] Building signed Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease
cd ..

echo ""
echo "============================================"
echo "  BUILD SUCCESSFUL!"
echo "============================================"
echo ""
echo "Signed AAB location:"
echo "  android/app/build/outputs/bundle/release/app-release.aab"
echo ""

if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
    FILE_SIZE=$(stat -f%z "android/app/build/outputs/bundle/release/app-release.aab" 2>/dev/null || stat -c%s "android/app/build/outputs/bundle/release/app-release.aab" 2>/dev/null || echo "unknown")
    echo "File size: $FILE_SIZE bytes"
    echo ""
    echo "To upload to Google Play Store:"
    echo "  1. Go to https://play.google.com/console"
    echo "  2. Navigate to your app > Release > Production"
    echo "  3. Upload: android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
fi