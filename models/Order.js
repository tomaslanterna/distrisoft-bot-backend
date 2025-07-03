const mongoose = require("mongoose");
const { Product } = require("./Product");

const orderSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
    index: true,
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Distributor",
    required: true,
    index: true,
  },
  products: [Product],
  total: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema, "order");
