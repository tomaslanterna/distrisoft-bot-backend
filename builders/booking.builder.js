const { v4: uuidv4 } = require("uuid");

const buildBooking = (data) => {
  const {
    distributor,
    clientEmail,
    clientName,
    clientPhone,
    date,
    time,
    entityId,
    description,
    status,
  } = data;

  const orderDate = new Date(date);
  const orderStatus = status || "pending";
  const bookingClient = {
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
  };

  return {
    distributorId: distributor._id,
    client: bookingClient,
    date: orderDate,
    time,
    entityId,
    description,
    status: orderStatus,
  };
};

const buildBookingsList = (data) => {
    
};

module.exports = {
  buildBooking,
};
