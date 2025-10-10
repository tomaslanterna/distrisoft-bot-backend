const express = require("express");
const {
  updateDistributor,
  getDistributorOrders,
  createDistributorProduct,
  getDistributorProducts,
  getDistributorCollections,
} = require("../controllers/distributorController");

const router = express.Router();

router.get("/orders", getDistributorOrders);
router.get("/products", getDistributorProducts);
router.get("/collections", getDistributorCollections);

router.post("/update", updateDistributor);
router.post("/products/create", createDistributorProduct);

module.exports = router;
