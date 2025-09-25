const express = require("express");
const {
  getOrderById,
  updateOrderStatusById,
} = require("../controllers/order.controller");

const router = express.Router();

router.get("/id", getOrderById);
router.post("/status", updateOrderStatusById);

module.exports = router;
