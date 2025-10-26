const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    description: {
      type: String,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model("Booking", bookingSchema, "bookings");
