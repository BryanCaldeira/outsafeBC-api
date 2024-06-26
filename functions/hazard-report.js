const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");
const {
  getReports,
  getReportsById,
  createReport,
  deleteReport,
  updateReport,
  getEndorsedReports,
  getFlaggedReport,
} = require("../sql/reports");
const { getCategoryOptionsById } = require("../sql/category-options");
const PushNotifications = require("@pusher/push-notifications-server");
const { getUsers } = require("../sql/users");

class HazardReport {
  constructor() {
    const coordinates = faker.location.nearbyGPSCoordinate();

    const hazardType = faker.helpers.arrayElement([
      "wildlife",
      "weather",
      "wildfire",
      "infrastructure",
    ]);

    const hazard = {
      wildlife: ["Bear", "Wolf"],
      weather: ["Flood", "Storm"],
      wildfire: [],
      infrastructure: ["Bridge", "Road"],
    };
    this.id = faker.string.uuid();
    this.location = {
      lat: coordinates[0],
      lng: coordinates[1],
      address: faker.location.ordinalDirection(),
    };
    this.hazardCategory = {
      id: faker.string.uuid(),
      name: hazardType,
      hasOptions: true,
    };
    this.hazard = {
      id: faker.string.uuid(),
      name: !!hazard[hazardType].length
        ? faker.helpers.arrayElement(hazard[hazardType])
        : hazardType,
    };
    this.comment = "No comments";
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
    (this.user = {
      email: faker.internet.email(),
      name: faker.person.fullName(),
    }),
      (this.images = [faker.image.url(), faker.image.url(), faker.image.url()]);
  }
}

const create = async (event) => {
  try {
    const {
      userId,
      hazardOptionId,
      location: { lat, lng, address },
      comment = "",
      images = [],
    } = JSON.parse(event.body);

    if (!lat || !lng || !hazardOptionId) {
      const fields = [
        ["latitude", lat],
        ["longitud", lng],
        ["hazard", hazardOptionId],
        // ["images", !!images.length],
        ["user", userId],
      ].filter((data) => !data[1]);

      const message = `
        <ul>
          ${fields.map((field) => `<li>${field[0]} is required</li>`)}
        </ul>`;

      return {
        ...headers,
        statusCode: 500,
        body: JSON.stringify({
          error: null,
          data: null,
          message,
        }),
      };
    }

    const { rows } = await createReport({
      latitude: lat,
      longitude: lng,
      address,
      category_option_id: hazardOptionId,
      comment,
      images,
      user_id: userId,
    });

    // const result = queryResponse.rows.map((report) => {
    //   return {
    //     id: report.id,
    //     location: {
    //       lat: Number(report.latitude),
    //       lng: Number(report.longitude),
    //       address: report.address ?? "",
    //     },
    //     hazardCategory: {
    //       // id: report.category_option_id,
    //       // name: report.category_name,
    //       //  "hasOptions":true
    //     },
    //     hazard: {
    //       id: report.category_option_id,
    //       // name: report.hazard_option_name,
    //     },
    //     comment: report.comments ?? "",
    //     created_at: report.created_at,
    //     updated_at: report.updated_at,
    //     deleted_at: report.deleted_at,
    //     still_there_count: report.still_there_count ?? 0,
    //     not_there_count: report.not_there_count ?? 0,
    //     flagged_count: report.flagged_count ?? 0,
    //     images: report.images,
    //     index: Number(report.index),
    //   };
    // });

    // const hazardOptionQuery = await getCategoryOptionsById(hazardOptionId);

    // const data = { ...result?.[0] };
    // if (hazardOptionQuery.rowCount > 0) {
    //   const hazardOption = hazardOptionQuery.rows[0];

    //   data.hazardCategory = {
    //     id: hazardOption.category_id,
    //     name: hazardOption.category_name,
    //     settings: hazardOption.category_settings,
    //   };

    //   data.hazard = {
    //     id: hazardOptionId,
    //     name: hazardOption.name,
    //   };
    // }

    // const Pusher = require("pusher");

    // const pusher = new Pusher({
    //   appId: "1691608",
    //   key: "353ae3f7ae29d42e5749",
    //   secret: "b393684fbb996abf150a",
    //   cluster: "us3",
    //   useTLS: true,
    // });

    // pusher.trigger("reports-channel", "new-report", data);

    const queryResponse = await getReportsById(rows?.[0]?.id);

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
              .filter((id) => id !== results?.[0]?.user?.email),
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
        message: "Hazard report created successfully",
      }),
    };
  } catch (error) {
    console.log({ error });
    return {
      ...headers,
      statusCode: 500,
      body: JSON.stringify({
        error: null,
        data: null,
        message: error.message,
      }),
    };
  }
};

const update = async (event) => {
  try {
    const { id } = event.queryStringParameters;

    const {
      userId,
      hazardOptionId,
      location: { lat, lng, address },
      comment = "",
      images = [],
    } = JSON.parse(event.body);

    if (!lat || !lng || !hazardOptionId || !userId || !id) {
      const fields = [
        ["latitude", lat],
        ["longitud", lng],
        ["hazard", hazardOptionId],
        // ["images", !!images.length],
        ["user", userId],
        ["id", id],
      ].filter((data) => !data[1]);

      const message = `
        <ul>
          ${fields.map((field) => `<li>${field[0]} is required</li>`)}
        </ul>`;

      return {
        ...headers,
        statusCode: 500,
        body: JSON.stringify({
          error: null,
          data: null,
          message,
        }),
      };
    }

    const queryResponse = await updateReport({
      latitude: lat,
      longitude: lng,
      address,
      category_option_id: hazardOptionId,
      comment,
      images,
      user_id: userId,
      id,
    });

    if (!queryResponse.rowCount) {
      return {
        ...headers,
        statusCode: 200,
        body: JSON.stringify({
          error: null,
          data: null,
          message: "No hazard report found",
        }),
      };
    }

    const result = queryResponse.rows.map((report) => {
      return {
        id: report.id,
        location: {
          lat: Number(report.latitude),
          lng: Number(report.longitude),
          address: report.address ?? "",
        },
        hazardCategory: {
          // id: report.category_option_id,
          // name: report.category_name,
          //  "hasOptions":true
        },
        hazard: {
          id: report.category_option_id,
          // name: report.hazard_option_name,
        },
        comment: report.comments ?? "",
        created_at: report.created_at,
        updated_at: report.updated_at,
        deleted_at: report.deleted_at,
        still_there_count: report.still_there_count ?? 0,
        not_there_count: report.not_there_count ?? 0,
        flagged_count: report.flagged_count ?? 0,
        images: report.images,
        index: Number(report.index),
      };
    });

    const hazardOptionQuery = await getCategoryOptionsById(hazardOptionId);

    const data = { ...result?.[0] };
    if (hazardOptionQuery.rowCount > 0) {
      const hazardOption = hazardOptionQuery.rows[0];

      data.hazardCategory = {
        id: hazardOption.category_id,
        name: hazardOption.category_name,
      };

      data.hazard = {
        id: hazardOptionId,
        name: hazardOption.name,
      };
    }

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: data,
        message: "Hazard report updated successfully",
      }),
    };
  } catch (error) {
    console.log({ error });
    return {
      ...headers,
      statusCode: 500,
      body: JSON.stringify({
        error: null,
        data: null,
        message: error.message,
      }),
    };
  }
};

const remove = async (event) => {
  // const report = new HazardReport();
  try {
    const { id } = event.queryStringParameters;

    const queryResponse = await deleteReport(id);

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: queryResponse.rows?.[0],
        message: "Hazard report deleted successfully",
      }),
    };
  } catch (error) {}
};

const get = async (event) => {
  const {
    user_id,
    type,
    lat,
    lng,
    hazard_option_ids = "",
    category_ids = "",
    cursor = 0,
    size = 10,
    radius = 5,
    count_only = false,
    active_only = false,
  } = event.queryStringParameters;

  // const reportList = [];

  // const limit = +size >= 100 ? 100 : +size;

  // for (let index = 0; index < limit; index++) {
  //   reportList.push(new HazardReport());
  // }

  const queryResponse = await getReports({
    user_id,
    lat,
    lng,
    hazard_option_ids: hazard_option_ids.split(",").filter((id) => !!id),
    category_ids: category_ids.split(",").filter((id) => !!id),
    type,
    cursor,
    size,
    radius,
    count_only,
    active_only,
  });

  const reportList = queryResponse.rows;

  const lastRow = reportList[reportList.length - 1];

  const after =
    Number(cursor + size) < Number(lastRow?.count ?? 0) ? lastRow?.index : null;

  const results = reportList.map((report) => {
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
        photo: report.user_photo,
      },
      images: report.images,
      index: Number(report.index),
    };
  });
  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: {
        results,
        size: +size,
        after,
        total: lastRow?.count ?? 0,
      },
      message: "",
    }),
  };
};

const getById = async (event) => {
  const { id, user_id } = event.queryStringParameters;

  const queryResponse = await getReportsById(id);

  let flagResponse = null;
  let reactionResponse = null;

  let enable_reaction = true;

  if (!!user_id) {
    flagResponse = await getFlaggedReport(id, user_id);
    reactionResponse = await getEndorsedReports(id, user_id);

    if (reactionResponse?.rowCount > 0) {
      const endorsement_date = reactionResponse.rows?.[0]?.created_at;

      const diff = Math.abs(new Date() - new Date(endorsement_date));

      const minutes = Math.floor(diff / 1000 / 60);
      if (minutes < 30) {
        enable_reaction = false;
      }
    }
  }

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
        photo: report.user_photo,
      },
      flagged_as_fake: flagResponse?.rowCount > 0,
      enable_reaction,
      images: report.images,
      index: Number(report.index),
    };
  });

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

  if (event.httpMethod === "POST") {
    const response = await create(event);
    return response;
  }

  if (event.httpMethod === "PATCH" && !!id) {
    const response = await update(event);
    return response;
  }

  if (event.httpMethod === "PUT" && !!id) {
    const response = await update(event);
    return response;
  }

  if (event.httpMethod === "DELETE" && !!id) {
    const response = await remove(event);
    return response;
  }

  if (event.httpMethod === "GET" && !!id) {
    const response = await getById(event);
    return response;
  }

  if (event.httpMethod === "GET" && !id) {
    const response = await get(event);
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
