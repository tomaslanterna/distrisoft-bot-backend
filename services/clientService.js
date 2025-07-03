const Client = require("../models/Client");

const getClientByPhone = async (clientPhone) => {
  return await Client.findOne({ phone: clientPhone });
};

module.exports = { getClientByPhone };
