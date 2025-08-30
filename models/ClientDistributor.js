const mongoose = require("mongoose");

const ClientDistributor = new mongoose.Schema({
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
  distributionDayOfWeek: {
    type: String,
    required: true,
    unique: false,
  },
});

module.exports = { ClientDistributor };
