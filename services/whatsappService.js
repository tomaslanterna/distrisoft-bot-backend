const sendWhatsAppMessage = async (req, clientPhone, botPhone, messageText) => {
  try {
    return await req.twilioClient.messages.create({
      body: messageText,
      from: `whatsapp:${botPhone}`,
      to: `whatsapp:${clientPhone}`,
    });
  } catch (twilioError) {
    console.error(
      `Failed to send WhatsApp message to ${clientPhone}:`,
      twilioError
    );
  }
};

module.exports = { sendWhatsAppMessage };
