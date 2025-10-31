const express = require("express");
const { bulkClientsController } = require("../controllers/clientController");

const router = express.Router();

router.post("/bulk-create", bulkClientsController);
router.get("/distributor")

module.exports = router;
