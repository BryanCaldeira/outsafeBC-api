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
const firebaseConfig = require("../utils/firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig.config);

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
          name: user?.name ?? firebaseUser.displayName,
          email: user?.email ?? firebaseUser.email,
          photo: user?.photo ?? firebaseUser.photoURL,
          stsTokenManager: firebaseUser?.stsTokenManager,
          accessToken: firebaseUser?.accessToken,
          metadata: firebaseUser?.metadata,
          notifications_enabled: user?.notifications_enabled,
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
      statusCode: 500,
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
          name: user?.name ?? firebaseUser.displayName,
          email: user?.email ?? firebaseUser.email,
          photo: user?.photo ?? firebaseUser.photoURL,
          stsTokenManager: firebaseUser?.stsTokenManager,
          accessToken: firebaseUser?.accessToken,
          metadata: firebaseUser?.metadata,
          notifications_enabled: user?.notifications_enabled,
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
      statusCode: 500,
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
