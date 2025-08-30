const Client = require("../models/Client");

const getClientByPhone = async (clientPhone) => {
  return await Client.findOne({ phone: clientPhone });
};

const getAllClients = async () => {
  return await Client.find({});
};

const bulkCreate = async (clients) => {
  return await Client.insertMany(clients);
};

module.exports = { getClientByPhone, getAllClients, bulkCreate };
