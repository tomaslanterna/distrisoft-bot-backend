const express = require("express");
const {
  proxyImageController,
} = require("../controllers/inspection.controller");

const router = express.Router();

// Ruta pública para servir imágenes de S3 mediante el proxy
router.get("/image", proxyImageController);

module.exports = router;
