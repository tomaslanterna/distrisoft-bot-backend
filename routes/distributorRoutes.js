const express = require("express");
const { updateDistributor } = require("../controllers/distributorController");

const router = express.Router();

router.post("/update", updateDistributor);

module.exports = router;
