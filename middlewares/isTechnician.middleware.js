const isTechnician = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    if (req.user.role !== "technician") {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error de servidor al validar rol",
      error: error.message,
    });
  }
};

module.exports = isTechnician;
