const SQLClient = require("./index.js");

async function getCategoryOptions() {
  const response = await SQLClient.query(
    `select co.*, c.id as category_id, c.name as category_name from category_options co join categories c on c.id = co.category_id`
  );

  return response;
}

async function getOptionsByCategory(categoryId) {
  const response = await SQLClient.query(
    `select co.*, c.id as category_id, c.name as category_name from category_options co join categories c on c.id = co.category_id where c.id = '${categoryId}' `
  );

  return response;
}

async function getCategoryOptionsById(id) {
  const response = await SQLClient.query(
    `select co.*, c.id as category_id, c.name as category_name, c.ui_settings as category_settings from category_options co join categories c on c.id = co.category_id where co.id = '${id}' `
  );

  return response;
}

module.exports = {
  getCategoryOptions,
  getOptionsByCategory,
  getCategoryOptionsById,
};
