const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false,
  },
  review: {
    type: mongoose.Schema.Types.Mixed, // puede ser un objeto con cualquier estructura
    default: {},
  },
  product_retailer_id: {
    type: String,
    required: true,
    trim: true,
  },
  currency: {
    type: String,
    enum: ["USD", "UYU", "ARS", "EUR"], // podés ajustar los tipos de moneda válidos
    default: "USD",
  },
  images: {
    type: [String], // array de URLs
    default: [],
  },
  availability: {
    type: String,
    enum: ["in stock", "out of stock", "preorder"],
    default: "in stock",
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  is_hidden: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Product", productSchema);
