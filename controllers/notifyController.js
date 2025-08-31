const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");

const { sendWhapiMessage } = require("../services/whatsappApiService");
const { getAllDistributors } = require("../services/distributorService");
dayjs.extend(weekday);

function getTomorrowDay() {
  const tomorrow = dayjs().add(1, "day");
  return tomorrow.format("dddd");
}

async function notifyClients(req,res) {
  try {
    const tomorrowDay = getTomorrowDay();

    const distributors = await getAllDistributors();

    for (const distributor of distributors) {
      for (const client of distributor.clients) {
        if (
          client.distributionDayOfWeek.toLowerCase() ===
          tomorrowDay.toLowerCase()
        ) {
          const message = `Hola ${client.name}, te recordamos que ${distributor.name} pasará mañana por tu zona.\n¡Ya puedes realizar tu pedido!`;
          await sendWhapiMessage(client.phone, message, distributor);
        }
      }
    }

    return res.status(200).send({ status: "messages sended correctly" });
  } catch (err) {
    console.error("Error en notifyClients:", err);
  }
}

module.exports = { notifyClients };
