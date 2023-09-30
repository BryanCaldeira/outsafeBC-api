const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} = require("firebase/auth");
const headers = require("../utils/headers");
const { cappitalize } = require("../utils/cappitalize");
const { getUser, createUser, updateUser } = require("../sql/users");

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

const handleGoogleProvider = async (event) => {
  try {
    const auth = getAuth(app);

    const body = JSON.parse(event.body);
    const { credential: idToken } = body;

    // Build Firebase credential with the Google ID token.
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in with credential from the Google user.
    const userCredential = await signInWithCredential(auth, credential);

    const firebaseUser = userCredential?.user;

    const name = !!firebaseUser?.displayName
      ? firebaseUser?.displayName?.split(" ")?.[0]
      : "";
    const lastname = !!firebaseUser.displayName
      ? firebaseUser?.displayName?.split(" ")?.[1]
      : "";

    const response = await createUser(
      firebaseUser?.uid,
      name,
      lastname,
      firebaseUser?.email,
      "google",
      firebaseUser?.photoURL ?? ""
    );

    const user = response?.rows?.[0];

    return {
      ...headers,
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

const get = async (event) => {
  try {
    const { id } = event.queryStringParameters;

    const result = await getUser(id);

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: result.rows.length ? result.rows[0] : null,
        message: result.rows.length ? "" : "No results found",
      }),
    };
  } catch (error) {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: error.message,
        data: null,
      }),
    };
  }
};

const create = async (event) => {
  try {
    const auth = getAuth(app);

    const body = JSON.parse(event.body);
    const { email, password } = body;

    const userCredential = await createUserWithEmailAndPassword(
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

    const response = await createUser(
      firebaseUser?.uid,
      name,
      lastname,
      firebaseUser?.email,
      "password",
      firebaseUser?.photoURL ?? ""
    );

    const user = response?.rows?.[0];

    return {
      ...headers,
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

const update = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, lastname, photo } = body;
    const { id } = event.queryStringParameters;

    if (!name && !lastname && !photo) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: null,
          data: { id },
          message: "No rows affected",
        }),
      };
    }

    const response = await updateUser(id, name, lastname, photo);

    const user = response?.rows?.[0];

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          id: user?.id,
          createdAt: user?.created_at,
          name: user?.name,
          lastname: user?.lastname,
          email: user?.email,
          photo: user?.photo,
        },
        message: "User updated successfully",
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
  const { provider, id } = event.queryStringParameters;

  if (event.httpMethod === "POST" && provider === "password") {
    const response = await create(event);
    return response;
  }

  if (event.httpMethod === "POST" && provider === "google") {
    const response = await handleGoogleProvider(event);
    return response;
  }

  if (event.httpMethod === "PUT" && !!id) {
    const response = await update(event);
    return response;
  }

  if (event.httpMethod === "GET" && !!id) {
    const response = await get(event);
    return response;
  }

  return {
    ...headers,
    statusCode: 404,
    body: JSON.stringify({
      error: `${event.httpMethod} not configured`,
      data: null,
    }),
  };
};
