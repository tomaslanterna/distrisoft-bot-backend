const axios = require("axios");
const { decrypt } = require("../utils/decrypt");

const WHAPI_URL = "https://gate.whapi.cloud";

async function sendWhapiMessage(to, message, distributor) {
  try {
    const distributorKey = distributor.key;
    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      {
        to,
        body: message,
      },
      {
        headers: {
          Authorization: `Bearer ${distributorKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Mensaje enviado:", response.data);
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function getWhapiOrderDetail(order, distributor) {
  try {
    const distributorKey = distributor.key;

    const { data } = await axios.get(
      `${WHAPI_URL}/business/orders/${order.order_id}?order_token=${order.token}&token=${distributorKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return data.items;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendWhapiMessage, getWhapiOrderDetail };
