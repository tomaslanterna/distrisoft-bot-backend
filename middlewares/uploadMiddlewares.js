const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

// Configuramos multer para almacenar archivos temporales
const upload = multer({ dest: "uploads/" });

// Middleware que inicializa Cloudinary y adjunta la instancia a req
const uploadMiddleware = [
  (req, res, next) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Lo agregamos a req para que el controller lo use directamente
    req.cloudinary = cloudinary;
    next();
  },

  // Middleware de multer que procesa múltiples imágenes
  upload.array("images"),
];

module.exports = { uploadMiddleware };
