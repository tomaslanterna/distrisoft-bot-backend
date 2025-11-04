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

const getDistributorByObjectId = async (distributorId) => {
  return await Distributor.findOne({ _id: distributorId }).lean();
};

module.exports = {
  getDistributorByPhone,
  getDistributorByChannelId,
  updateDistributorByPhone,
  getAllDistributors,
  getDistributorByObjectId,
};
