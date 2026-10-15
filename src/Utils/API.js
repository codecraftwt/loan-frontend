import { Platform } from 'react-native';

/**
 * Automatically detects whether the app is running on an Android Emulator
 * or on a Physical Device, so both can connect to your local backend seamlessly.
 *
 * - Android Emulator -> uses 10.0.2.2:5001 (host loopback alias)
 * - Physical Device (USB) -> uses localhost:5001 (requires: adb reverse tcp:5001 tcp:5001)
 */
const isAndroidEmulator = () => {
  if (Platform.OS !== 'android') return false;
  const { Model = '', Fingerprint = '', Brand = '' } = Platform.constants || {};
  const model = (Model || '').toLowerCase();
  const fingerprint = (Fingerprint || '').toLowerCase();
  const brand = (Brand || '').toLowerCase();

  return (
    model.includes('sdk') ||
    model.includes('emulator') ||
    model.includes('google_sdk') ||
    model.includes('generic') ||
    fingerprint.includes('generic') ||
    fingerprint.includes('sdk') ||
    brand.includes('generic')
  );
};

export const baseurl = isAndroidEmulator()
  ? 'http://10.0.2.2:5001/api/'
  : 'http://localhost:5001/api/';

// Alternative: If physical phone is on Wi-Fi without USB cable:
// export const baseurl = 'http://10.0.4.196:5001/api/';

// Live / Production URLs (for reference)
// export const baseurl = 'https://loan-managment-backend.vercel.app/api/';
// export const baseurl = 'https://loan-management-1idq.onrender.com/api/';
// export const baseurl = 'https://loan-backend-cv1k.onrender.com/api/';
// export const baseurl = 'https://plum-stinkbug-598204.hostingersite.com/api/';