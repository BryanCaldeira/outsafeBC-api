const { faker } = require("@faker-js/faker");
const headers = require("../utils/headers");
const { getCategories, getCategory } = require("../sql/categories");
const {
  getCategoryOptions,
  getOptionsByCategory,
} = require("../sql/category-options");

const HAZARD_CATEGORY_LIST = [
  "wildlife",
  "weather",
  "wildfire",
  "infrastructure",
];

const HAZARD_OPTIONS = {
  wildlife: ["Bear", "Wolf"],
  weather: ["Flood", "Storm"],
  wildfire: ["Wildfire"],
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

const getMocked = async (_event) => {
  const list = HAZARD_CATEGORY_LIST.map((category) => ({
    id: faker.string.uuid(),
    name: category,
    icon: `${category}-icon`,
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

const getByIdMocked = async (event) => {
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

const get = async (_event) => {
  try {
    const categories = await getCategories();
    const options = await getCategoryOptions();

    const data = categories.rows.map((data) => ({
      id: data.id,
      name: data.name,
      icon: `${data?.name?.toLowerCase()}-icon`.replace(" ", "-"),
      description: data.description,
      ui_settings: data.ui_settings,
      options: options.rows
        .filter((option) => option.category_id === data.id)
        .map(({ id, name }) => ({ id, name })),
    }));

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        data,
        message: null,
        error: null,
      }),
    };
  } catch (error) {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: "Unexpected error when retrieving categories.",
        data: null,
        message: null,
      }),
    };
  }
};

const getById = async (event) => {
  try {
    const { id } = event.queryStringParameters;

    const response = await getCategory(id);

    if (!response.rows.length) {
      return {
        ...headers,
        statusCode: 404,
        body: JSON.stringify({
          error: null,
          data: null,
          message: "Category not found",
        }),
      };
    }

    const category = response.rows[0];
    const options = await getOptionsByCategory(id);

    const data = {
      id: category.id,
      name: category.name,
      icon: `${category?.name?.toLowerCase()}-icon`.replace(" ", "-"),
      description: category.description,
      ui_settings: category.ui_settings,
      options: options.rows
        .filter((option) => option.category_id === category.id)
        .map(({ id, name }) => ({ id, name })),
    };

    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: null,
        data,
        message: null,
      }),
    };
  } catch (error) {
    return {
      ...headers,
      statusCode: 200,
      body: JSON.stringify({
        error: "Unexpected error when retrieving category.",
        data: null,
        message: null,
      }),
    };
  }
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
