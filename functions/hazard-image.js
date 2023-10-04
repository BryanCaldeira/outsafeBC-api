const { initializeApp } = require("firebase/app");
const {
  ref,
  getStorage,
  uploadString,
  getDownloadURL,
} = require("firebase/storage");
const headers = require("../utils/headers");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1wk-w6KW-dFVFYabxaXRIx2yfNJOmKeI",
  authDomain: "campbuddy-4944b.firebaseapp.com",
  projectId: "campbuddy-4944b",
  storageBucket: "campbuddy-4944b.appspot.com",
  messagingSenderId: "914763218338",
  appId: "1:914763218338:web:eee692db2abba6b000c6fb",
  measurementId: "G-QPG084P9N6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage(app, "gs://campbuddy-4944b.appspot.com");

exports.handler = async (event) => {
  const { fileName } = event.queryStringParameters;

  if (!fileName) {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: "fileName required",
        data: null,
        message: null,
      }),
    };
  }
  const file = event.body;

  if (event.httpMethod === "POST") {
    const storageRef = ref(storage, "hazard-report/" + fileName);

    await uploadString(storageRef, file, "base64");

    const url = await getDownloadURL(storageRef);

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          url,
        },
        message: null,
      }),
    };
  }

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: `${event.httpMethod} image endpoint to be implemented`,
      data: null,
      message: null,
    }),
  };
};
