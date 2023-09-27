const SQLClient = require("./index.js");

async function getUser(id) {
  const response = await SQLClient.query(
    `select * from users where id = '${id}' `
  );

  return response;
}

module.exports = {
  getUser,
};
