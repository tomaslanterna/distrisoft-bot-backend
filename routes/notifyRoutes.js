const express = require("express");
const { notifyClients } = require("../controllers/notifyController");
const cronJobNotifyMiddleware = require("../middlewares/cronJobNotifyMiddleware");

const router = express.Router();

router.post("/create", cronJobNotifyMiddleware, notifyClients);

module.exports = router;
