export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyB_84CXwJqjPuVunEVCFJsnkunHk3ExmKQ",
    authDomain: "mm-dates.firebaseapp.com",
    projectId: "mm-dates",
    storageBucket: "mm-dates.firebasestorage.app",
    messagingSenderId: "800703062777",
    appId: "1:800703062777:web:b09c193885287cc1387828",
    measurementId: "G-30R742E9BS"
  },
  /**
   * Web Push (VAPID) public key — Firebase Console → Project Settings →
   * Cloud Messaging → Web configuration → "Web Push certificates" → Generate key pair.
   * Required for FCM web push (notifications of new expenses).
   */
  vapidKey: "BJUYwaWFmDqQa7Y4YvjyDojm7013qU7q7Z_KoKnH91WrnJkykXt_-6LIaJbcGP99hM8jWtmUnWwr7VTkDJHSqY4",
};
