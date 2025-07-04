const cron = require("node-cron");
const dayjs = require("dayjs");
const { getAllClients } = require("../services/clientService");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const notifyAllClients = async () => {
  try {
    console.log("⏰ Ejecutando cron interno...");

    const clients = await getAllClients();
    const tomorrow = dayjs().add(1, "day");

    // Filtramos solo los clientes a notificar
    const clientsToNotify = clients.filter((client) => {
      if (!client.distributionDate || !client.phone || !client.name)
        return false;

      const distDate = dayjs(client.distributionDate);
      return (
        distDate.date() === tomorrow.date() &&
        distDate.month() === tomorrow.month()
      );
    });

    // Creamos un array de promesas para enviar todos los mensajes en paralelo
    const messagePromises = clientsToNotify.map((client) => {
      const message = `Hola ${client.name}, mañana pasa tu distribuidora como es habitual. ¿Qué productos vas a necesitar?`;

      return sendWhatsAppMessage(null, client.phone, message)
        .then(() => {
          console.log(`📨 Mensaje enviado a ${client.phone}`);
        })
        .catch((err) => {
          console.error(
            `❌ Error al enviar mensaje a ${client.phone}:`,
            err.message
          );
        });
    });

    // Ejecutamos todos los envíos en paralelo
    await Promise.all(messagePromises);

    console.log(
      `✅ Todos los mensajes han sido procesados (${clientsToNotify.length})`
    );
  } catch (err) {
    console.error("❌ Error en cron job interno:", err.message);
  }
};

module.exports = notifyAllClients;
