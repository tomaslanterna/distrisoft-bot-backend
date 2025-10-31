const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Por favor ingresa un email válido"],
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
});

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
    client: clientSchema,
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model("Booking", bookingSchema, "bookings");
