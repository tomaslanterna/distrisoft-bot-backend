const express = require("express");
const {
  notifyClients,
  notifyClientsFirstMessage,
} = require("../controllers/notifyController");
const cronJobNotifyMiddleware = require("../middlewares/cronJobNotifyMiddleware");

const router = express.Router();

router.post("/create", cronJobNotifyMiddleware, notifyClients);
router.post(
  "/create/first",
  cronJobNotifyMiddleware,
  notifyClientsFirstMessage
);

module.exports = router;
