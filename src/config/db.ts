import { Sequelize } from "sequelize";

import dotenv from "dotenv";

dotenv.config();
const isProduction = process.env.NODE_ENV === "production";

// Setup DB (MySQL)
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql" as const,
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
  }
);

export default sequelize;
