const Distributor = require("../models/Distributor");

const getDistributorByPhone = async (distributorPhone) => {
  return await Distributor.findOne({ phone: distributorPhone });
};

module.exports = { getDistributorByPhone };
