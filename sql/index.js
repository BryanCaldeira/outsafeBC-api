const { Client } = require("pg");

const sql = () => {
  const client = new Client({
    user: "postgres",
    host: "db.kghmcyjroojadmqkwkyh.supabase.co",
    database: "postgres",
    password: "At&KrLX9EF?!@qa",
    port: 5432,
  });

  client.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
  });

  return client;
};
const SQLClient = sql();

module.exports = SQLClient;
