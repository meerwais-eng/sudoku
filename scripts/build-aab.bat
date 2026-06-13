@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Sudoku AAB Build Script (Windows)
echo  Produces a signed Android App Bundle
echo ============================================
echo.

:: =====================================================
:: Step 0: Validate prerequisites
:: =====================================================

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check Java JDK (needed for Gradle builds)
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Java JDK is not installed. Please install JDK 17+ first.
    echo Download from: https://adoptium.net/
    echo Ensure JAVA_HOME is set and java is in PATH.
    pause
    exit /b 1
)

:: Check keystore exists
if not exist "android\app\release.keystore" (
    echo.
    echo ERROR: Release keystore not found at android\app\release.keystore
    echo You must generate it first. Run: scripts\generate-keystore.bat
    echo.
    pause
    exit /b 1
)

:: Check keystore passwords are set in gradle.properties
findstr /c:"RELEASE_KEYSTORE_PASSWORD=" android\gradle.properties | findstr /v /c:"RELEASE_KEYSTORE_PASSWORD=" >nul 2>nul
for /f "tokens=2 delims==" %%a in ('findstr /c:"RELEASE_KEYSTORE_PASSWORD=" android\gradle.properties') do set KS_PASS=%%a
if "%KS_PASS%"=="" (
    echo.
    echo ERROR: RELEASE_KEYSTORE_PASSWORD is empty in android\gradle.properties
    echo Set it via environment variable or re-run scripts\generate-keystore.bat
    echo.
    pause
    exit /b 1
)

echo Prerequisites validated. Proceeding with build...
echo.

:: =====================================================
:: Step 1: Install npm dependencies
:: =====================================================
echo [1/5] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)
echo.

:: =====================================================
:: Step 2: Build Next.js static export + Capacitor sync
:: =====================================================
echo [2/5] Building Next.js static export (BUILD_TARGET=android) + Capacitor sync...
call npm run build:android
if %errorlevel% neq 0 (
    echo ERROR: Next.js build + Capacitor sync failed.
    pause
    exit /b 1
)
echo.

:: =====================================================
:: Step 3: Generate Android mipmap icons
:: =====================================================
echo [3/5] Generating Android mipmap icons from logo.svg...
call node scripts\generate-android-icons.mjs
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Android icons.
    pause
    exit /b 1
)
echo.

:: =====================================================
:: Step 4: Clean Gradle cache
:: =====================================================
echo [4/5] Cleaning Gradle build cache...
cd android
call gradlew.bat clean
if %errorlevel% neq 0 (
    echo WARNING: Gradle clean had issues (non-critical, continuing).
)
cd ..
echo.

:: =====================================================
:: Step 5: Build the signed AAB (Android App Bundle)
:: =====================================================
echo [5/5] Building signed Android App Bundle (AAB)...
cd android
call gradlew.bat bundleRelease
if %errorlevel% neq 0 (
    echo.
    echo ERROR: AAB build failed.
    echo Common issues:
    echo   - Keystore passwords not set in gradle.properties
    echo   - JAVA_HOME not pointing to JDK 17+
    echo   - Missing Capacitor plugin dependencies
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo  BUILD SUCCESSFUL!
echo ============================================
echo.
echo Signed AAB location:
echo   android\app\build\outputs\bundle\release\app-release.aab
echo.

:: Verify the AAB file exists
if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    for %%f in ("android\app\build\outputs\bundle\release\app-release.aab") do (
        echo File size: %%~zf bytes
    )
    echo.
    echo To upload to Google Play Store:
    echo   1. Go to https://play.google.com/console
    echo   2. Navigate to your app ^> Release ^> Production
    echo   3. Upload: android\app\build\outputs\bundle\release\app-release.aab
    echo.
) else (
    echo WARNING: AAB file not found at expected path.
    echo Check android\app\build\outputs\bundle\release\ for the output.
    echo.
)

echo To install on a connected device (for testing, uses debug APK):
echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.

pause