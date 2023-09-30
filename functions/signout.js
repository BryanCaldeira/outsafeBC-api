const { signOut } = require("firebase/auth");
const headers = require("../utils/headers");

exports.handler = async (event) => {
  const auth = JSON.parse(event.body);

  if (event.httpMethod === "POST" && !!auth?.currentUser) {
    try {
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
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: error.message,
          data: null,
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
