const buildOrderMessage = require("../builders/buildOrderMessage");
const Order = require("../models/Order");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const { getClientByPhone } = require("../services/clientService");
const { getDistributorByPhone } = require("../services/distributorService");
const { createOrder } = require("../services/order.Service");

const whatsAppWebHook = async (req, res) => {
  try {
    const fromNumber = req.body.From;
    const toNumber = req.body.To;
    const body = req.body.Body;

    if (!fromNumber || !body) {
      return res.status(400).send("Faltan datos");
    }

    const clientPhone = fromNumber.replace("whatsapp:", "").trim();
    const message = body.trim();
    const distributorBotPhone = toNumber.replace("whatsapp:", "").trim(); // Podés mapear dinámicamente si querés
    const date = new Date().toISOString();

    const order = buildOrderMessage(body);

    if (!order) {
      await sendWhatsAppMessage(
        req,
        clientPhone,
        distributorBotPhone,
        `Lo sentimos, unicamente recibimos pedidos.`
      );

      return res.status(404).json({
        success: false,
        message: `Order not found in message`,
      });
    }

    // Validate required fields
    if (!clientPhone || !distributorBotPhone || !message || !date) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: clientPhone, distributorBotPhone, message, date",
      });
    }

    // Validate date format
    const orderDate = new Date(date);
    if (isNaN(orderDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use ISO date string.",
      });
    }

    // Find client by phone
    const client = await getClientByPhone(clientPhone);

    if (!client) {
      // Send error message to client phone number
      await sendWhatsAppMessage(
        req,
        clientPhone,
        distributorBotPhone,
        `Lo sentimos, no encontramos tu número ${clientPhone} en nuestro sistema. Por favor contacta con soporte para registrarte.`
      );

      return res.status(404).json({
        success: false,
        message: `Client with phone ${clientPhone} not found.`,
      });
    }

    // Find distributor by name
    const distributor = await getDistributorByPhone(distributorBotPhone);
    if (!distributor) {
      // Send error message to client
      await sendWhatsAppMessage(
        req,
        clientPhone,
        distributorBotPhone,
        `Lo sentimos, la distribuidora no está disponible en este momento. Por favor contacta con soporte.`
      );

      return res.status(404).json({
        success: false,
        message: `Distributor not found.`,
      });
    }

    const confirmDistributionPhone = distributor.orderPhone;

    // Create new order
    const createdOrder = await createOrder({
      message: message,
      date: orderDate,
      client: client._id,
      products: order.products,
      total: order.total,
      distributor: distributor._id,
    });

    // Send success WhatsApp message to client and distributor
    const successConfirmOrderMessage = `Gracias por tu pedido. Recibimos: '${message}'. Te avisamos ante cualquier novedad.`;
    const successCreatedOrderMessage = `Pedido creado. Detalle: '${message}'`;

    await Promise.all([
      sendWhatsAppMessage(
        req,
        clientPhone,
        distributorBotPhone,
        successConfirmOrderMessage
      ),
      sendWhatsAppMessage(
        req,
        confirmDistributionPhone,
        distributorBotPhone,
        successCreatedOrderMessage
      ),
    ]);

    // Twilio espera respuesta XML o vacía:
    return res.status(200).send("<Response></Response>");
  } catch (error) {
    console.error("Error en webhook:", error);
    return res.status(500).send("Error interno");
  }
};

module.exports = {
  whatsAppWebHook,
};
