const express = require("express");
const {
  whatsAppWebHook,
  whapiWebHook,
} = require("../controllers/orderController");
const verifyTwilioSignature = require("../middlewares/verifyTwiloSignatureMiddleware");
const twilioClientMiddleware = require("../middlewares/createTwiloClientMiddleware");

const router = express.Router();

router.post(
  "/whatsapp/webhook",
  verifyTwilioSignature,
  twilioClientMiddleware,
  whatsAppWebHook
);

router.post("/whapi/webhook", whapiWebHook);

module.exports = router;
