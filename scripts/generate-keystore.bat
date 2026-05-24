@echo off
REM =====================================================
REM Generate the Android release keystore for Sudoku Premium
REM =====================================================
REM
REM This script creates a production-grade RSA 2048-bit keystore
REM for signing Android release builds (AAB/APK).
REM
REM IMPORTANT: After generating, set the passwords in
REM   android/gradle.properties or as environment variables.
REM NEVER commit the keystore file or passwords to git.
REM
REM Usage: generate-keystore.bat
REM Output: android/app/release.keystore

setlocal enabledelayedexpansion

echo === Generating Android Release Keystore for Sudoku Premium ===
echo.

set KEYSTORE_DIR=android\app
set KEYSTORE_FILE=%KEYSTORE_DIR%\release.keystore
set KEY_ALIAS=sudoku
set VALIDITY_DAYS=10000

REM --- Prompt for passwords (secure input) ---
echo Enter the keystore STORE password (min 6 chars, keep this safe!):
set /p STORE_PASSWORD=Store Password: 

echo Enter the keystore KEY password (can be same as store password):
set /p KEY_PASSWORD=Key Password: 

if "%STORE_PASSWORD%"=="" (
    echo ERROR: Store password cannot be empty.
    pause
    exit /b 1
)
if "%KEY_PASSWORD%"=="" (
    echo ERROR: Key password cannot be empty.
    pause
    exit /b 1
)

REM --- Check if keystore already exists ---
if exist "%KEYSTORE_FILE%" (
    echo.
    echo WARNING: Keystore file already exists at %KEYSTORE_FILE%
    echo If you continue, it will be OVERWRITTEN.
    echo Press Ctrl+C to cancel, or
    pause
    del "%KEYSTORE_FILE%"
)

REM --- Check for keytool (JDK) ---
where keytool >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: keytool is not found in your PATH.
    echo keytool is part of the JDK. Install JDK 17+ from https://adoptium.net/
    echo After installing, ensure JAVA_HOME is set and keytool is in PATH.
    pause
    exit /b 1
)

REM --- Generate the keystore ---
echo.
echo Generating keystore with RSA 2048-bit key...
keytool -genkeypair ^
  -v ^
  -keystore "%KEYSTORE_FILE%" ^
  -alias "%KEY_ALIAS%" ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity %VALIDITY_DAYS% ^
  -storepass "%STORE_PASSWORD%" ^
  -keypass "%KEY_PASSWORD%" ^
  -dname "CN=Sudoku Premium, OU=Mobile, O=SudokuApp, L=Istanbul, C=TR"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Keystore generation failed.
    pause
    exit /b 1
)

echo.
echo === Keystore Generated Successfully ===
echo.
echo Keystore file: %KEYSTORE_FILE%
echo Key alias:     %KEY_ALIAS%
echo Validity:       %VALIDITY_DAYS% days (~27 years)
echo.

REM --- Extract SHA-256 fingerprint ---
echo === Extracting SHA-256 Fingerprint ===
keytool -list ^
  -v ^
  -keystore "%KEYSTORE_FILE%" ^
  -alias "%KEY_ALIAS%" ^
  -storepass "%STORE_PASSWORD%" ^
  2>nul | findstr "SHA256:"

echo.

REM --- Update gradle.properties with keystore config ---
echo === Updating android/gradle.properties ===

REM Create a temp file with updated values
set GRADLE_PROPS=android\gradle.properties
set TEMP_FILE=android\gradle.properties.tmp

type "%GRADLE_PROPS%" | findstr /v "RELEASE_KEYSTORE_PATH=" | findstr /v "RELEASE_KEYSTORE_PASSWORD=" | findstr /v "RELEASE_KEY_ALIAS=" | findstr /v "RELEASE_KEY_PASSWORD=" > "%TEMP_FILE%"

echo RELEASE_KEYSTORE_PATH=android/app/release.keystore>> "%TEMP_FILE%"
echo RELEASE_KEYSTORE_PASSWORD=%STORE_PASSWORD%>> "%TEMP_FILE%"
echo RELEASE_KEY_ALIAS=%KEY_ALIAS%>> "%TEMP_FILE%"
echo RELEASE_KEY_PASSWORD=%KEY_PASSWORD%>> "%TEMP_FILE%"

copy /y "%TEMP_FILE%" "%GRADLE_PROPS%" >nul
del "%TEMP_FILE%"

echo gradle.properties updated with keystore configuration.
echo.

REM --- Add keystore to .gitignore ---
echo === Ensuring keystore is in .gitignore ===
findstr /c:"release.keystore" .gitignore >nul 2>nul
if %errorlevel% neq 0 (
    echo # Android release keystore (NEVER commit)>> .gitignore
    echo release.keystore>> .gitignore
    echo Added release.keystore to .gitignore
) else (
    echo release.keystore already in .gitignore
)

echo.
echo ============================================
echo  KEYSTORE SETUP COMPLETE
echo ============================================
echo.
echo Next steps:
echo   1. BACKUP the keystore file to a secure location!
echo      If you lose this file, you cannot update your app on Play Store.
echo   2. Run: scripts\build-aab.bat
echo      to build the signed Android App Bundle.
echo.
echo WARNING: The passwords are now stored in android/gradle.properties.
echo For production, consider using environment variables instead:
echo   set RELEASE_KEYSTORE_PASSWORD=your_password
echo   set RELEASE_KEY_PASSWORD=your_password
echo.

pause