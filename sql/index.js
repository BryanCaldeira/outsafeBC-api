const { Client } = require("pg");

const sql = () => {
  const client = new Client({
    user: process.env.DB_USER_NAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true
  });

  client.connect(function (err) {
    if (err) throw err;
    // console.log("Connected!");
  });

  return client;
};
const SQLClient = sql();

module.exports = SQLClient;
