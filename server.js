const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
});

const orderRoutes = require("./routes/order.routes");
const messageRoutes = require("./routes/message.routes");
const clientRoutes = require("./routes/clientRoutes");
const distributorRoutes = require("./routes/distributorRoutes");
const notifyRoutes = require("./routes/notifyRoutes");
const authRoutes = require("./routes/auth.routes");
const bookingRoutes = require("./routes/booking.routes");
const inspectionRoutes = require("./routes/inspection.routes");
const vehicleRoutes = require("./routes/vehicle.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
const authMiddleware = require("./middlewares/auth.middleware");

// Routes
app.use("/message", messageRoutes);
app.use("/order", orderRoutes);
// app.use("/client", clientRoutes);
app.use("/distributor", distributorRoutes);
app.use("/notify", notifyRoutes);
app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/inspection", authMiddleware, inspectionRoutes);
app.use("/vehicle", authMiddleware, vehicleRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const mongoUrl = process.env.MONGODB_URI;

// MongoDB connection
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;
