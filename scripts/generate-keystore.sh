#!/bin/bash
# =====================================================
# Generate the Android release keystore for Sudoku Premium
# =====================================================
#
# This script creates a production-grade RSA 2048-bit keystore
# for signing Android release builds (AAB/APK).
#
# IMPORTANT: After generating, set the passwords in
#   android/gradle.properties or as environment variables.
# NEVER commit the keystore file or passwords to git.
#
# Usage: ./scripts/generate-keystore.sh
# Output: android/app/release.keystore

set -e

echo "=== Generating Android Release Keystore for Sudoku Premium ==="
echo ""

KEYSTORE_DIR="android/app"
KEYSTORE_FILE="${KEYSTORE_DIR}/release.keystore"
KEY_ALIAS="sudoku"
VALIDITY_DAYS=10000

# --- Prompt for passwords ---
read -sp "Enter the keystore STORE password (min 6 chars, keep this safe!): " STORE_PASSWORD
echo ""
read -sp "Enter the keystore KEY password (can be same as store password): " KEY_PASSWORD
echo ""

if [ -z "$STORE_PASSWORD" ] || [ -z "$KEY_PASSWORD" ]; then
    echo "ERROR: Passwords cannot be empty."
    exit 1
fi

# --- Check if keystore already exists ---
if [ -f "$KEYSTORE_FILE" ]; then
    echo ""
    echo "WARNING: Keystore file already exists at $KEYSTORE_FILE"
    echo "If you continue, it will be OVERWRITTEN."
    read -p "Press Enter to overwrite, or Ctrl+C to cancel..."
    rm -f "$KEYSTORE_FILE"
fi

# --- Check for keytool (JDK) ---
if ! command -v keytool &> /dev/null; then
    echo ""
    echo "ERROR: keytool is not found in your PATH."
    echo "keytool is part of the JDK. Install JDK 17+ from https://adoptium.net/"
    exit 1
fi

# --- Generate the keystore ---
echo ""
echo "Generating keystore with RSA 2048-bit key..."
keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -storepass "$STORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "CN=Sudoku Premium, OU=Mobile, O=SudokuApp, L=Istanbul, C=TR"

echo ""
echo "=== Keystore Generated Successfully ==="
echo ""
echo "Keystore file: $KEYSTORE_FILE"
echo "Key alias:     $KEY_ALIAS"
echo "Validity:       $VALIDITY_DAYS days (~27 years)"
echo ""

# --- Extract SHA-256 fingerprint ---
echo "=== Extracting SHA-256 Fingerprint ==="
FINGERPRINT=$(keytool -list \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -storepass "$STORE_PASSWORD" \
  | grep "SHA256:" \
  | head -1 \
  | sed 's/SHA256: //' \
  | tr -d ' ')

echo "SHA-256 Fingerprint: $FINGERPRINT"
echo ""

# --- Update gradle.properties ---
echo "=== Updating android/gradle.properties ==="
GRADLE_PROPS="android/gradle.properties"

# Remove existing keystore lines and append new ones
sed -i '/^RELEASE_KEYSTORE_PATH=/d; /^RELEASE_KEYSTORE_PASSWORD=/d; /^RELEASE_KEY_ALIAS=/d; /^RELEASE_KEY_PASSWORD=/d' "$GRADLE_PROPS"

echo "RELEASE_KEYSTORE_PATH=android/app/release.keystore" >> "$GRADLE_PROPS"
echo "RELEASE_KEYSTORE_PASSWORD=$STORE_PASSWORD" >> "$GRADLE_PROPS"
echo "RELEASE_KEY_ALIAS=$KEY_ALIAS" >> "$GRADLE_PROPS"
echo "RELEASE_KEY_PASSWORD=$KEY_PASSWORD" >> "$GRADLE_PROPS"

echo "gradle.properties updated with keystore configuration."
echo ""

# --- Add keystore to .gitignore ---
echo "=== Ensuring keystore is in .gitignore ==="
if ! grep -q "release.keystore" .gitignore 2>/dev/null; then
    echo "# Android release keystore (NEVER commit)" >> .gitignore
    echo "release.keystore" >> .gitignore
    echo "Added release.keystore to .gitignore"
else
    echo "release.keystore already in .gitignore"
fi

echo ""
echo "============================================"
echo "  KEYSTORE SETUP COMPLETE"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. BACKUP the keystore file to a secure location!"
echo "     If you lose this file, you cannot update your app on Play Store."
echo "  2. Run: ./scripts/build-aab.sh"
echo "     to build the signed Android App Bundle."
echo ""
echo "WARNING: The passwords are now stored in android/gradle.properties."
echo "For production, consider using environment variables instead:"
echo "  export RELEASE_KEYSTORE_PASSWORD=your_password"
echo "  export RELEASE_KEY_PASSWORD=your_password"
echo ""