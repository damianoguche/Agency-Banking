"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sequelize_1 = require("sequelize");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var isProduction = process.env.NODE_ENV === "production";
// Setup DB (MySQL)
var sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: Number(process.env.DB_PORT || 3306),
    logging: false,
    dialectOptions: isProduction
        ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
        : {}
});
exports.default = sequelize;
