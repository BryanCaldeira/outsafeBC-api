const { getByUser, upsertNotification } = require("../sql/notifications");
const headers = require("../utils/headers");

exports.handler = async (event) => {
  const { user_id } = event.queryStringParameters;

  if (event.httpMethod === "GET") {
    if (!user_id) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: "user_id is required",
          data: null,
          message: null,
        }),
      };
    }

    try {
      const response = await getByUser(user_id);
      const data = response.rows?.[0];

      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: null,
          data: {
            user_id,
            is_enabled: false,
            ...data,
          },
          message: null,
        }),
      };
    } catch (error) {
      return {
        ...headers,
        statusCode: 500,
        body: JSON.stringify({
          error: error,
          data: null,
          message: error.message,
        }),
      };
    }
  }

  if (event.httpMethod === "PUT") {
    if (!user_id) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: "user_id is required",
          data: null,
          message: null,
        }),
      };
    }

    const { is_enabled = false } = JSON.parse(event.body);

    try {
      const response = await upsertNotification(user_id, is_enabled);
      const data = response.rows?.[0];

      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: null,
          data,
          message: "Settings updateds successfully",
        }),
      };
    } catch (error) {
      return {
        ...headers,
        statusCode: 500,
        body: JSON.stringify({
          error: error,
          data: null,
          message: error.message,
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
