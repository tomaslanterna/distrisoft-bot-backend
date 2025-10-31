const express = require("express");
const {
  updateDistributor,
  getDistributorOrders,
  getDistributorInfoById,
} = require("../controllers/distributorController");

const router = express.Router();

router.post("/update", updateDistributor);
router.get("/orders", getDistributorOrders);
router.get("/info"), getDistributorInfoById;

module.exports = router;
