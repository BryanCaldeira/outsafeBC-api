const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");
const {
  getReports,
  getReportsById,
  createReport,
  deleteReport,
  updateReport,
} = require("../sql/reports");
const { getCategoryOptionsById } = require("../sql/category-options");

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

    if (!lat || !lng || !hazardOptionId || !images.length) {
      const fields = [
        ["latitude", lat],
        ["longitud", lng],
        ["hazard", hazardOptionId],
        ["images", !!images.length],
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

    const queryResponse = await createReport({
      latitude: lat,
      longitude: lng,
      address,
      category_option_id: hazardOptionId,
      comment,
      images,
      user_id: userId,
    });

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

    if (!lat || !lng || !hazardOptionId || !images.length || !userId || !id) {
      const fields = [
        ["latitude", lat],
        ["longitud", lng],
        ["hazard", hazardOptionId],
        ["images", !!images.length],
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
    cursor = 0,
    size = 10,
    radius = 5,
    count_only = false,
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
    type,
    cursor,
    size,
    radius,
    count_only,
  });

  const reportList = queryResponse.rows;

  const lastRow = reportList[reportList.length - 1];

  const after =
    Number(cursor + size) < Number(lastRow?.count ?? 0) ? lastRow?.index : null;

  const results = reportList.map((report) => {
    console.log({ report });
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
  const { id } = event.queryStringParameters;
  // const report = new HazardReport();

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
