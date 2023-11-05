// import { getAuth, sendPasswordResetEmail } from "firebase/auth";
const { initializeApp } = require("firebase/app");
const { getAuth, sendPasswordResetEmail } = require("firebase/auth");
const headers = require("../utils/headers");
const firebaseConfig = require("../utils/firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig.config);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        data: null,
      }),
    };
  }

  if (event.httpMethod === "POST") {
    try {
      const auth = JSON.parse(event.body);
      if (auth && auth.email) {
        const authInstance = getAuth(app);
        await sendPasswordResetEmail(authInstance, auth.email);
        return {
          ...headers,
          statusCode: 200,
          body: JSON.stringify({
            error: null,
            data: null,
            message: `Password reset link sent to ${auth.email}`,
          }),
        };
      } else {
        return {
          ...headers,
          statusCode: 400, // Bad request
          body: JSON.stringify({
            error: "Missing email in request body",
            data: null,
            message: null,
          }),
        };
      }
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return {
        ...headers,
        statusCode: 500, // Internal Server Error
        body: JSON.stringify({
          error: "Error sending password reset email",
          data: null,
          message: null,
        }),
      };
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
