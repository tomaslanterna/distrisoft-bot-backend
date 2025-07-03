const express = require("express");
const { whatsAppWebHook } = require("../controllers/orderController");
const verifyTwilioSignature = require("../middlewares/verifyTwiloSignatureMiddleware");
const twilioClientMiddleware = require("../middlewares/createTwiloClientMiddleware");

const router = express.Router();

router.post(
  "/whatsapp/webhook",
  verifyTwilioSignature,
  twilioClientMiddleware,
  whatsAppWebHook
);

module.exports = router;
