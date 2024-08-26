// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

require('dotenv').config()

module.exports = {
  config: {
    apiKey: process.env.FB_APIKEY,
    authDomain: process.env.FB_AUTH_DOMAIN,
    projectId: process.env.FB_PROJECT_ID,
    storageBucket: process.env.FB_STORAGE_BUCKET,
    messagingSenderId: process.env.FB_MESSAGE_SENDER_ID,
    appId: process.env.FB_APP_ID,
    measurementId: process.env.FB_MESUREMENT_ID,
  },
  firestoreURL: process.env.FB_STORE_URL,
  storagePublicURL: process.env.FB_PUBLIC_STORAGE_URL,
};
