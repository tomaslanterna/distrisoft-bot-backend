const twilio = require("twilio");

const verifyTwilioSignature = (req, res, next) => {
  const signature = req.headers["x-twilio-signature"];
  const { TWILIO_AUTH_TOKEN, SERVICE_URL } = process.env;

  const isValid = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    signature,
    SERVICE_URL,
    req.body
  );

  if (!isValid) {
    return res.status(403).send("Firma inválida. Solo Twilio puede acceder.");
  }

  next();
};

module.exports = verifyTwilioSignature;
