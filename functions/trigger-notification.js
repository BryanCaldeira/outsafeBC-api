const headers = require("../utils/headers");
const { getReportsById } = require("../sql/reports");

const PushNotifications = require("@pusher/push-notifications-server");
const { getUsers } = require("../sql/users");

const getById = async (event) => {
  const { id } = event.queryStringParameters;

  const queryResponse = await getReportsById(id);

  const results = queryResponse.rows.map((report) => {
    return {
      id: report.id,
      location: {
        lat: Number(report.latitude),
        lng: Number(report.longitude),
        address: report.address ?? "",
      },
      hazardCategory: {
        id: report.category_id,
        name: report.category_name,
        settings: report.category_settings,
        //  "hasOptions":true
      },
      hazard: {
        id: report.category_option_id,
        name: report.hazard_option_name,
      },
      comment: report.comments ?? "",
      created_at: report.created_at,
      updated_at: report.updated_at,
      deleted_at: report.deleted_at,
      still_there_count: report.still_there_count ?? 0,
      not_there_count: report.not_there_count ?? 0,
      flagged_count: report.flagged_count ?? 0,
      user: {
        email: report.user_email,
        name: report.user_name,
      },
      images: report.images,
      index: Number(report.index),
    };
  });

  const Pusher = require("pusher");

  const pusher = new Pusher({
    appId: "1691608",
    key: "353ae3f7ae29d42e5749",
    secret: "b393684fbb996abf150a",
    cluster: "us3",
    useTLS: true,
  });

  pusher.trigger("reports-channel", "new-report", results?.[0]);

  let beamsClient = new PushNotifications({
    instanceId: "db0b4e69-d055-47b5-a8bf-784a5157b8d6",
    secretKey:
      "40CBBE3DF7615DAC8130477B2A30F515F0AF7E07FE84D6338ACDF654567F9DA7",
  });

  const users = await getUsers();

  if (users.rowCount > 0) {
    beamsClient
      .publishToInterests(
        [
          ...users.rows
            .map((user) => user.id)
            .filter((id) => id !== results?.[0].user.email),
        ],
        {
          web: {
            notification: {
              title: "Outsafe BC",
              body: "New Hazard has been reported!",
            },
            data: results?.[0],
          },
        }
      )
      .then((publishResponse) => {
        console.log("Just published:", publishResponse.publishId);
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  }

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: results?.[0],
      message: "",
    }),
  };
};

exports.handler = async (event) => {
  const { id } = event.queryStringParameters;

  if (event.httpMethod === "GET" && !!id) {
    const response = await getById(event);
    return response;
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        data: null,
      }),
    };
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
