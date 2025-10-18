require("ts-node/register");
require("dotenv").config();

const { dbConfig } = require("../src/config/db.ts");

const env = process.env.NODE_ENV || "development";

module.exports = {
  [env]: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging
  }
};
