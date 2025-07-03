const mongoose = require("mongoose");

const distributorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  orderPhone: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "Distributor",
  distributorSchema,
  "distributor"
);
