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

const getOrderByObjectId = async (orderId) => {
  const orderObjectId = new mongoose.Types.ObjectId(orderId);
  return await Order.findOne({ _id: orderObjectId }).lean();
};

const updateOrderStatusById = async (orderId, newStatus) => {
  const orderObjectId = new mongoose.Types.ObjectId(orderId);
  return await Order.findByIdAndUpdate(
    orderObjectId,
    { status: newStatus },
    { new: true }
  ).lean();
};

module.exports = {
  createOrder,
  getOrdersByDistributorId,
  getOrderByObjectId,
  updateOrderStatusById,
};
