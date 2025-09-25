const express = require("express");
const { whapiWebHook } = require("../controllers/message.controller");

const router = express.Router();

router.post("/whapi/webhook", whapiWebHook);

module.exports = router;
