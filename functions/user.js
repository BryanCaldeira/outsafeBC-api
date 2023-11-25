const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  deleteUser: deleteFirebaseUser,
} = require("firebase/auth");
const headers = require("../utils/headers");
const { cappitalize } = require("../utils/cappitalize");
const { getUser, createUser, updateUser, deleteUser } = require("../sql/users");
const firebaseConfig = require("../utils/firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig.config);

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

    const response = await createUser(
      firebaseUser?.uid,
      firebaseUser?.displayName,
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
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        data: null,
        message: null,
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
      statusCode: 500,
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
    const { email, password, name } = body;

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential?.user;

    const response = await createUser(
      firebaseUser?.uid,
      name ?? "",
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
          name: name,
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
      statusCode: 500,
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
    const { name, photo } = body;
    const { id } = event.queryStringParameters;

    if (!name && !photo) {
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

    const response = await updateUser(id, name ?? "", photo ?? undefined);

    const user = response?.rows?.[0];

    if (!user) {
      return {
        ...headers,
        statusCode: 404,
        body: JSON.stringify({
          error: "User not found",
          data: {
            id: user?.id,
            createdAt: user?.created_at,
            name: user?.name,
            email: user?.email,
            photo: user?.photo,
          },
        }),
      };
    }
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          id: user?.id,
          createdAt: user?.created_at,
          name: user?.name,
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
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        data: null,
      }),
    };
  }
};

const remove = async (event) => {
  try {
    if (!event.body) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: "Invalid request body",
          data: null,
          message: null,
        }),
      };
    }

    const auth = JSON.parse(event.body);

    if (!auth?.currentUser) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: "currentUser is required",
          data: null,
          message: null,
        }),
      };
    }

    const user = { ...auth.currentUser };

    const auth2 = getAuth(app);

    try {
      await deleteFirebaseUser(auth.currentUser);
    } catch (error) {
      // return {
      //   ...headers,
      //   statusCode: 200,
      //   body: JSON.stringify({
      //     error: "Something went wrong. User was not deleted.",
      //     data: null,
      //   }),
      // };
    }

    const response = await deleteUser(user.uid);

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: {
          ...response?.rows?.[0],
        },
        message: "User deleted successfully",
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
  const { provider, id } = event.queryStringParameters;

  if (event.httpMethod === "OPTIONS") {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        data: null,
      }),
    };
  }

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

  if (event.httpMethod === "DELETE") {
    const response = await remove(event);
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
