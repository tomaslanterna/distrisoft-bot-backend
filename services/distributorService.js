const Distributor = require("../models/Distributor");

const getDistributorByPhone = async (distributorPhone) => {
  return await Distributor.findOne({ phone: distributorPhone });
};

const getDistributorByChannelId = async (distributorChannelId) => {
  return await Distributor.findOne({ channelId: distributorChannelId });
};

module.exports = { getDistributorByPhone, getDistributorByChannelId };
