const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");
const {
  getReports,
  getReportsById,
  createReport,
  deleteReport,
} = require("../sql/reports");

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

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data: queryResponse.rows?.[0],
        message: "Hazard report created successfully",
      }),
    };
  } catch (error) {
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
  const report = new HazardReport();
  const { id } = event.queryStringParameters;

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: { ...report, id },
      message: "Hazard report updated successfully",
    }),
  };
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

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: {
        results: reportList,
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

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: queryResponse.rows?.[0],
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

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: "Invalid request",
      data: null,
    }),
  };
};
