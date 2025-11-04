const express = require("express");
const {
  updateDistributor,
  getDistributorOrders,
  createDistributorProduct,
  getDistributorProducts,
  getDistributorCollections,
  updateDistributorCollection,
  createDistributorCollection,
  deleteDistributorCollection,
} = require("../controllers/distributorController");

const router = express.Router();

router.get("/orders", getDistributorOrders);
router.get("/products", getDistributorProducts);
router.get("/collections", getDistributorCollections);

router.post("/update", updateDistributor);
router.post("/products/create", createDistributorProduct);
router.post("/collection/create", createDistributorCollection);

router.patch("/collection/update", updateDistributorCollection);

router.delete("/collection/delete", deleteDistributorCollection);

module.exports = router;
