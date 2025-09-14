const { default: mongoose } = require("mongoose");
const Order = require("../models/Order");

const createOrder = async (orderData) => {
  const order = new Order(orderData);
  return await order.save();
};

const getOrdersByDistributorId = async (distributorId) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Order.find({ distributor: distributorObjectId });
};

module.exports = { createOrder, getOrdersByDistributorId };
