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
  getDistributorUsersStats,
  createDistributorUser,
} = require("../controllers/distributorController");
const { uploadMiddleware } = require("../middlewares/uploadMiddlewares");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

router.get("/orders", getDistributorOrders);
router.get("/products", getDistributorProducts);
router.get("/collections", getDistributorCollections);
router.get("/users-stats", authMiddleware, getDistributorUsersStats);
router.post("/users/create", authMiddleware, createDistributorUser);

router.post("/update", updateDistributor);
router.post("/products/create", createDistributorProduct);
router.post("/collection/create", createDistributorCollection);
router.post("/upload/images", uploadMiddleware, uploadDistributorImages);

router.patch("/collection/update", updateDistributorCollection);

router.delete("/collection/delete", deleteDistributorCollection);

module.exports = router;
