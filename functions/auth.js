const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} = require("firebase/auth");
const { getUserWithFirebase } = require("../sql/users");
const headers = require("../utils/headers");
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

const handleEmailAndPassword = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    const auth = getAuth(app);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential?.user;

    const response = await getUserWithFirebase(firebaseUser.uid);

    const user = response?.rows?.[0];

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          id: user?.id,
          createdAt: user?.created_at,
          name: firebaseUser?.displayName,
          email: firebaseUser?.email,
          photo: firebaseUser?.photoURL,
          stsTokenManager: firebaseUser?.stsTokenManager,
          accessToken: firebaseUser?.accessToken,
          metadata: firebaseUser?.metadata,
          auth,
        },
      }),
    };
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = error.message;

    if (typeof errorCode === "string" && errorCode.includes("auth/")) {
      const message = errorCode.replace("auth/", "").split("-").join(" ");
      errorMessage = cappitalize(message);
    }

    return {
      ...headers,
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
    const { credential: idToken } = body;
    const auth = getAuth(app);

    // Build Firebase credential with the Google ID token.
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in with credential from the Google user.
    const userCredential = await signInWithCredential(auth, credential);

    const firebaseUser = userCredential?.user;

    const response = await getUserWithFirebase(firebaseUser?.uid);

    const user = response?.rows?.[0];

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          id: user?.id,
          createdAt: user?.created_at,
          name: firebaseUser?.displayName,
          email: firebaseUser?.email,
          photo: firebaseUser?.photoURL,
          stsTokenManager: firebaseUser?.stsTokenManager,
          accessToken: firebaseUser?.accessToken,
          metadata: firebaseUser?.metadata,
          auth,
        },
      }),
    };
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = error.message;

    if (typeof errorCode === "string" && errorCode.includes("auth/")) {
      const message = errorCode.replace("auth/", "").split("-").join(" ");
      errorMessage = cappitalize(message);
    }

    return {
      ...headers,
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
  const { email, password } = JSON.parse(event.body);

  if (event.httpMethod === "POST" && !!email && !!password) {
    const response = await handleEmailAndPassword(event);
    return response;
  }

  if (event.httpMethod === "POST" && provider === "google") {
    const response = await handleGoogleProvider(event);
    return response;
  }

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: `${event.httpMethod} is not configured yet`,
      data: null,
      message: null,
    }),
  };
};
