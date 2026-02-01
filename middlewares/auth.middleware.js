const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No se proporcionó un token de autenticación válido",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validar campos requeridos
    if (!decoded.id || !decoded.username || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Token inválido: faltan campos obligatorios",
      });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      distributorId: decoded.distributorId,
      distributorChannelId: decoded.distributorChannelId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
