const Client = require("../models/Client");

const getClientByPhone = async (clientPhone) => {
  return await Client.findOne({ phone: clientPhone });
};

const getAllClients = async () => {
  return await Client.find({});
};

module.exports = { getClientByPhone, getAllClients };
