const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getUserWithFirebase } = require("../sql/users");

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

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body);

  if (event.httpMethod === "POST") {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential?.user;

    const name = !!firebaseUser?.displayName
      ? firebaseUser?.displayName?.split(" ")?.[0]
      : "";
    const lastname = !!firebaseUser.displayName
      ? firebaseUser?.displayName?.split(" ")?.[1]
      : "";

    const response = await getUserWithFirebase();

    const user = response?.rows?.[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          id: user?.id,
          createdAt: user?.created_at,
          name,
          lastname,
          email: firebaseUser?.email,
          photo: firebaseUser?.photoURL,
          stsTokenManager: firebaseUser?.stsTokenManager,
          accessToken: firebaseUser?.accessToken,
          metadata: firebaseUser?.metadata,
        },
      }),
    };
  }

  return {
    statusCode: 200,
    body: `${event.httpMethod} not configured`,
  };
};
