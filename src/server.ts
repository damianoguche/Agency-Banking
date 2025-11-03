import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import walletRoutes from "./routes/walletRoutes";
import sequelize from "./config/db";
import adminRoutes from "./routes/adminRoutes";
import customerRoutes from "./routes/customerRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import reconcileRoutes from "./routes/reconRoutes";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded forms
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/remediation", reconcileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);

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

// Serve React static files
const __dirnamePath = path.resolve();
const frontendPath = path.join(__dirnamePath, "../frontend/dist");

app.use(express.static(frontendPath));

// Serve React index.html for all non-API routes
app.get(/.*/, (_, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

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
