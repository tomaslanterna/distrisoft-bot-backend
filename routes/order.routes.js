const express = require("express");
const {
  getOrderById,
  updateOrderStatusById,
  createOrderByDistributor,
} = require("../controllers/order.controller");

const router = express.Router();

router.get("/id", getOrderById);
router.post("/create", createOrderByDistributor);
router.post("/status", updateOrderStatusById);

module.exports = router;
