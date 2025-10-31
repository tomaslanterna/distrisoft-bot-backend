const Client = require("../models/Client");

const getClientByPhone = async (clientPhone) => {
  return await Client.findOne({ phone: clientPhone });
};

const getClientById = async (clientId) => {
  return await Client.findOne({ _id: clientId }).lean();
};

const getClientsByDistributorId = async (distributorId) => {
  return await Client.find({ distributor: distributorId }).lean();
};

const getAllClients = async () => {
  return await Client.find({});
};

const bulkCreate = async (clients) => {
  return await Client.insertMany(clients);
};

module.exports = {
  getClientByPhone,
  getAllClients,
  bulkCreate,
  getClientById,
  getClientsByDistributorId,
};
