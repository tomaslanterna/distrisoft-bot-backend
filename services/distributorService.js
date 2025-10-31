const { default: mongoose } = require("mongoose");
const Distributor = require("../models/Distributor");

const getDistributorByPhone = async (distributorPhone) => {
  return await Distributor.findOne({ phone: distributorPhone });
};

const getDistributorByChannelId = async (distributorChannelId) => {
  return await Distributor.findOne({ channelId: distributorChannelId });
};

const updateDistributorByPhone = async (distributor) => {
  return await Distributor.updateOne(
    { phone: distributor.phone },
    { $set: distributor }
  );
};

const getAllDistributors = async () => {
  return await Distributor.find({});
};

const getDistributorById = async (distributorId) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Distributor.findOne({ _id: distributorObjectId }).lean();
};

module.exports = {
  getDistributorByPhone,
  getDistributorByChannelId,
  updateDistributorByPhone,
  getAllDistributors,
  getDistributorById,
};
