const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");

const HAZARD_CATEGORY_LIST = [
  "wildlife",
  "weather",
  "wildfire",
  "infrastructure",
];

const HAZARD_OPTIONS = {
  wildlife: ["Bear", "Wolf"],
  weather: ["Flood", "Storm"],
  wildfire: [],
  infrastructure: ["Bridge", "Road"],
};

class HazardCategory {
  constructor() {
    const hazardCategory = faker.helpers.arrayElement(HAZARD_CATEGORY_LIST);

    this.id = faker.string.uuid();
    this.name = hazardCategory;
    this.description = faker.lorem.words(10);
    this.hasOptions = true;
    this.uiSettings = {
      hazardOptionTitle: `What kind of ${hazardCategory}?`,
    };
  }
}

const get = async (_event) => {
  const list = HAZARD_CATEGORY_LIST.map((category) => ({
    id: faker.string.uuid(),
    name: category,
    description: faker.lorem.words(10),
    options: HAZARD_OPTIONS[category].map((option) => ({
      id: faker.string.uuid(),
      name: option,
    })),
  }));

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: list,
      message: null,
    }),
  };
};

const getById = async (event) => {
  const { id } = event.queryStringParameters;

  const hazadType = new HazardCategory();
  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: { ...hazadType, id },
      message: null,
    }),
  };
};

exports.handler = async (event) => {
  const { id } = event.queryStringParameters;

  if (event.httpMethod === "GET" && !id) {
    const response = await get(event);
    return response;
  }

  if (event.httpMethod === "GET" && !!id) {
    const response = await getById(event);
    return response;
  }

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: `${event.httpMethod} hazard category endpoint to be implemented`,
      data: null,
      message: null,
    }),
  };
};
