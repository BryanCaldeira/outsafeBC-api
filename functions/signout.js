const { initializeApp } = require("firebase/app");
const { signOut, getAuth } = require("firebase/auth");
const headers = require("../utils/headers");
const firebaseConfig = require("../utils/firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig.config);

exports.handler = async (event) => {
  const auth = JSON.parse(event.body);

  if (event.httpMethod === "POST" && !!auth?.currentUser) {
    try {
      const auth2 = getAuth(app);

      await signOut(auth);
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: null,
          data: null,
          message: `${auth?.currentUser?.email} signed out`,
        }),
      };
    } catch (error) {
      // return {
      //   ...headers,
      //   statusCode: 200,
      //   body: JSON.stringify({
      //     error: error.message,
      //     data: null,
      //   }),
      // };
    }
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
