const twilio = require("twilio");

const verifyTwilioSignature = (req, res, next) => {
  const signature = req.headers["x-twilio-signature"];
  const { TWILIO_AUTH_TOKEN } = process.env;

  const url = `https://9f9f-2800-a4-1d40-5d00-d811-ce27-abc6-6c3a.ngrok-free.app/message/whatsapp/webhook`;
  const isValid = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body
  );

  if (!isValid) {
    return res.status(403).send("Firma inválida. Solo Twilio puede acceder.");
  }

  next();
};

module.exports = verifyTwilioSignature;
