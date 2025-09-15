const express = require("express");
const {
  whatsAppWebHook,
  whapiWebHook,
  getOrderById,
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

router.get("/id", getOrderById);

module.exports = router;
