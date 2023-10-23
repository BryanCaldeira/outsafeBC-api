const SQLClient = require("./index.js");

async function getCategories() {
  const response = await SQLClient.query(`select * from categories`);

  return response;
}

async function getCategory(id) {
  const response = await SQLClient.query(
    `select * from categories where id = '${id}' `
  );

  return response;
}

module.exports = {
  getCategories,
  getCategory,
};
