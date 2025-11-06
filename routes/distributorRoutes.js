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
  uploadDistributorImages,
} = require("../controllers/distributorController");
const { uploadMiddleware } = require("../middlewares/uploadMiddlewares");

const router = express.Router();

router.get("/orders", getDistributorOrders);
router.get("/products", getDistributorProducts);
router.get("/collections", getDistributorCollections);

router.post("/update", updateDistributor);
router.post("/products/create", createDistributorProduct);
router.post("/collection/create", createDistributorCollection);
router.post("/upload/images", uploadMiddleware, uploadDistributorImages);

router.patch("/collection/update", updateDistributorCollection);

router.delete("/collection/delete", deleteDistributorCollection);

module.exports = router;
