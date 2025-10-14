const express = require("express");
const {
  updateDistributor,
  getDistributorOrders,
  createDistributorProduct,
  getDistributorProducts,
  getDistributorCollections,
  updateDistributorCollection,
  createDistributorCollection,
} = require("../controllers/distributorController");

const router = express.Router();

router.get("/orders", getDistributorOrders);
router.get("/products", getDistributorProducts);
router.get("/collections", getDistributorCollections);

router.post("/update", updateDistributor);
router.post("/products/create", createDistributorProduct);
router.post("/collection/create", createDistributorCollection);

router.patch("/collection/update", updateDistributorCollection);

module.exports = router;
