const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");

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
    this.images = [faker.image.url, faker.image.url, faker.image.url];
  }
}

const create = async (_event) => {
  const report = new HazardReport();

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: report,
      message: "Hazard report created successfully",
    }),
  };
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
  const report = new HazardReport();
  const { id } = event.queryStringParameters;

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: { ...report, id },
      message: "Hazard report deleted successfully",
    }),
  };
};

const get = async (event) => {
  const { cursor, size } = event.queryStringParameters;

  const reportList = [];

  const limit = +size >= 100 ? 100 : +size;

  for (let index = 0; index < limit; index++) {
    reportList.push(new HazardReport());
  }

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: {
        results: reportList,
        size: +size,
        after: +cursor + +size,
        total: 100,
      },
      message: "",
    }),
  };
};

const getById = async (event) => {
  const { id } = event.queryStringParameters;
  const report = new HazardReport();

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: { ...report, id: id },
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
