const multer = require("multer");

// Configuramos multer para almacenar archivos temporales
const upload = multer({ dest: "uploads/" });

// Middleware de multer que procesa múltiples imágenes
const uploadMiddleware = [upload.array("images")];

module.exports = { uploadMiddleware };
