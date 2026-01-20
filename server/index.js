import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import { PORT, NODE_ENV } from "./src/utils/constants.js";

// Import models to register them with Mongoose
import "./src/models/Employee.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`
    ========================================
    Server is running in ${NODE_ENV} mode
    Port: ${PORT}
    URL: http://localhost:${PORT}
    ========================================
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

export default server;
