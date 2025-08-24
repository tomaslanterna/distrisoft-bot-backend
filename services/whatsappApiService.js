const axios = require("axios");
const { decrypt } = require("../utils/decrypt");

const WHAPI_URL = "https://gate.whapi.cloud/messages/text";

async function sendWhapiMessage(to, message, distributor) {
  try {
    const distributorKey = distributor.key;
    const response = await axios.post(
      WHAPI_URL,
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

module.exports = { sendWhapiMessage };
