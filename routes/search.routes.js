const express = require("express");
const {
  universalSearchController,
} = require("../controllers/search.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @route POST /search
 * @desc Search for vehicles and in-progress inspections by plate
 * @access Private
 */
router.post("/", authMiddleware, universalSearchController);

module.exports = router;
