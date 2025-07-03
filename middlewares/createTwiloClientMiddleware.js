const twilio = require("twilio");

const twilioClientMiddleware = async (req, res, next) => {
  const { TWILIO_SID, TWILIO_AUTH_TOKEN } = process.env;
  console.log(
    "🟢 Ejecutando twilioClientMiddleware",
    TWILIO_SID,
    TWILIO_AUTH_TOKEN
  );

  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: "Twilio credentials not configured" });
  }

  req.twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

  next();
};

module.exports = twilioClientMiddleware;
