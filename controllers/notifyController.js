const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");

const { sendWhapiMessage } = require("../services/whatsappApiService");
const { getAllDistributors } = require("../services/distributorService");
dayjs.extend(weekday);

function getTomorrowDay() {
  const tomorrow = dayjs().add(1, "day");
  return tomorrow.format("dddd");
}

async function notifyClients(req, res) {
  try {
    const tomorrowDay = getTomorrowDay();

    const distributors = await getAllDistributors();
    const contacts = [
      { name: "LA FAMILIA ST", phone: "59895911124" },
      { name: "LA FAMILIA EM", phone: "59899023141" },
      { name: "OHANA 56", phone: "59898312112" },
      { name: "PRIMAVERA", phone: "59897230743" },
      { name: "ANFELU", phone: "59891355352" },
      { name: "AGUADA", phone: "59894936250" },
      { name: "BRASILIA", phone: "59892770614" },
      { name: "FEVI", phone: "59893953856" },
      { name: "LA PAZ", phone: "59897520707" },
      { name: "FULL 24 HS", phone: "59895119385" },
      { name: "MARIA", phone: "59894900091" },
      { name: "VERY GOOD", phone: "59893364234" },
      { name: "SUPERFRUTAS", phone: "59894130883" },
      { name: "VINTAGE", phone: "59891759420" },
      { name: "LA TENTACIÓN ROBINSON", phone: "59897628375" },
      { name: "SILVIA", phone: "59898912012" },
      { name: "SUERTE EN PILA", phone: "59895310567" },
      { name: "LUJI", phone: "59894699162" },
      { name: "LA TENTACION", phone: "59894596022" },
      { name: "TOMI", phone: "59892356335" },
      { name: "BRUNO", phone: "59891310235" },
    ];

    for (const distributor of distributors) {
      for (const client of contacts) {
        const message = `👋 Hola ${client.name}, te recordamos que ${distributor.name} pasará mañana por tu zona.🚚`;
        const message2 = `📦 Ya puedes realizar tu pedido ingresando a nuestro catalogo\n https://wa.me/c/${distributor.phone}`;

        await sendWhapiMessage(client.phone, message, distributor);
        await sendWhapiMessage(client.phone, message2, distributor);
      }
    }

    return res.status(200).send({ status: "messages sended correctly" });
  } catch (err) {
    console.error("Error en notifyClients:", err);
  }
}

async function notifyClientsFirstMessage(req, res) {
  const infoMessage = `Mi función es ayudarte a pedir más fácil y rápido:\n✅ Escribo un día antes de tu reparto y consulto si necesitás mercadería.\n✅ Registro tu pedido.\n✅ Te muestro nuestro catálogo actualizado con precios.`;
  const priceMessage = `👉 Esta semana podés comprar con los precios viejos, aunque ya están cargados los nuevos que aplican desde la próxima.\nY si preferís seguir trabajando como siempre, solo avisale a Bruno por su via normal de comunicacion.`;

  const distributors = await getAllDistributors();

  for (const distributor of distributors) {
    for (const client of distributor.clients) {
      const welcomeMessage = `👋 ¡Hola! Soy DistriBot, el asistente virtual de ${distributor.name}. Hace años te llevamos productos como Evita, Mio, El Aguante y más.`;

      await Promise.all([
        sendWhapiMessage(client.phone, welcomeMessage, distributor),
        sendWhapiMessage(client.phone, infoMessage, distributor),
        sendWhapiMessage(client.phone, priceMessage, distributor),
      ]);
    }
  }

  return res.status(200).send({ status: "messages sended correctly" });
}

module.exports = { notifyClients, notifyClientsFirstMessage };
