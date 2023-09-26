const { faker } = require("@faker-js/faker");

const HAZAR_TYPE_LIST = [
  "wildlife",
  "weather",
  "wildfire",
  "infrastructure",
]

class HazardType {
  constructor(){
    const hazardType = faker.helpers.arrayElement(HAZAR_TYPE_LIST);

    this.id = faker.string.uuid()
    this.name = hazardType
    this.hasOptions = true
    this.title = `What kind of ${hazardType}?`
  }
}

const get = async (_event)=>{
  return {
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: HAZAR_TYPE_LIST,
      message: null,
    }),
  };

}

const getById = async (event)=>{
  const { id } = event.queryStringParameters;

  const hazadType = new HazardType()
  return {
    statusCode: 200,
    body: JSON.stringify({
      error: null,
      data: {...hazadType,id},
      message: null,
    }),
  };
}

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
    statusCode: 200,
    body: 'hazard category endpoint to be implemented'
  };
};
