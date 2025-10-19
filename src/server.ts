import dotenv from "dotenv";
dotenv.config();
import express from "express";
import sequelize from "./config/db.ts";
import customerRoutes from "./routes/customerRoutes.ts";
import transactionRoutes from "./routes/transactionRoutes.ts";
import reconcileRoutes from "./routes/reconRoutes.ts";

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded forms
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/customers", customerRoutes);
app.use("/transactions", transactionRoutes);
app.use("/remediation", reconcileRoutes);

// DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database!");

    await sequelize.sync({ alter: false });
    console.log("Models synchronized!");
  } catch (err) {
    console.error("Database connection error:", err);
  }
})();

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("SIGINT", () => {
  console.log("\nGracefully shutting down...");

  // Close HTTP server first
  server.close(async () => {
    console.log("Server stopped accepting new connections.");

    try {
      // Close DB connection
      await sequelize.close();
      console.log("Database connection closed.");
      console.log("Server shutdown complete. Goodbye!");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
});
