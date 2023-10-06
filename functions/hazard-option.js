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

class HazardOption {
  constructor() {
    const hazardCategory = faker.helpers.arrayElement(HAZARD_CATEGORY_LIST);

    const options = HAZARD_OPTIONS[hazardCategory];
    const hazardOption = faker.helpers.arrayElement(options);
    this.id = faker.string.uuid();
    this.name = !!options.length ? hazardOption : hazardCategory;
    this.description = faker.lorem.words(10);
    this.hasOptions = !!options.length;
    this.uiSettings = {
      hazardOptionTitle: `What kind of ${hazardCategory}?`,
    };
  }
}

const get = async (event) => {
  const { categoryId } = event.queryStringParameters;

  const hazardCategory = faker.helpers.arrayElement(HAZARD_CATEGORY_LIST);

  const options = HAZARD_OPTIONS[hazardCategory];

  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: options.map((option) => ({
        categoryId,
        id: faker.string.uuid(),
        name: option,
        description: faker.lorem.words(10),
      })),
      message: null,
    }),
  };
};

const getById = async (event) => {
  const { id } = event.queryStringParameters;

  const hazadOption = new HazardOption();
  return {
    ...headers,
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: { ...hazadOption, id },
      message: null,
    }),
  };
};

exports.handler = async (event) => {
  const { id, categoryId } = event.queryStringParameters;

  if (event.httpMethod === "GET" && !id && !!categoryId) {
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
