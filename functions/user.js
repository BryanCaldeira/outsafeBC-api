const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} = require("firebase/auth");
const { cappitalize } = require("../utils/cappitalize");

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
const auth = getAuth(app);

const create = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    return {
      statusCode: 200,
      body: JSON.stringify({ error: null, data: user }),
    };
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = error.message;

    if (typeof errorCode === "string" && errorCode.includes("auth/")) {
      const message = errorCode.replace("auth/", "").split("-").join(" ");
      errorMessage = cappitalize(message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        error: errorMessage,
        data: null,
      }),
    };
  }
};

const handleGoogleProvider = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { credential :idToken} = body;

    // Build Firebase credential with the Google ID token.
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in with credential from the Google user.
    const response = await signInWithCredential(auth, credential);

    return {
      statusCode: 200,
      body: JSON.stringify({ error: null, data: response }),
    };
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = error.message;

    if (typeof errorCode === "string" && errorCode.includes("auth/")) {
      const message = errorCode.replace("auth/", "").split("-").join(" ");
      errorMessage = cappitalize(message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        error: errorMessage,
        data: null,
      }),
    };
  }
};

exports.handler = async (event) => {
  const { provider } = event.queryStringParameters;

  if (event.httpMethod === "POST" && provider === "email") {
    const response = await create(event);
    return response;
  }

  if (event.httpMethod === "POST" && provider === "google") {
    const response = await handleGoogleProvider(event);
    return response;
  }

  return {
    statusCode: 404,
    body: JSON.stringify({
      error: `${event.httpMethod} not configured`,
      data: null,
    }),
  };
};
