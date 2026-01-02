@echo off
echo ========================================
echo Getting SHA-1 Fingerprint for Firebase
echo ========================================
echo.

echo For DEBUG keystore:
echo -------------------
keytool -list -v -keystore app\debug.keystore -alias androiddebugkey -storepass android -keypass android
echo.

echo ========================================
echo Instructions:
echo ========================================
echo 1. Copy the SHA-1 and SHA-256 fingerprints from above
echo 2. Go to Firebase Console: https://console.firebase.google.com
echo 3. Select your project: loan-app-da81f
echo 4. Go to Project Settings ^> Your apps ^> Android app
echo 5. Click "Add fingerprint" and paste SHA-1 and SHA-256
echo 6. Download the updated google-services.json
echo 7. Replace android\app\google-services.json with the new file
echo 8. Rebuild the app: npx react-native run-android
echo.

pause

