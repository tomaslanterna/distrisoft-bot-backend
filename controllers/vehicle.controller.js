const { Vehicle } = require("../models/Vehicle");

const updateVehicleStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING_REVIEW",
      "REJECTED_REVIEW",
      "SUCCESSFULLY_REVIEW",
    ];

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "ID de vehículo y estado son requeridos.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Permitidos: ${allowedStatuses.join(", ")}`,
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado.",
      });
    }

    // Optional: Add Ownership Check here if strictly needed
    // if (vehicle.businessId.toString() !== req.user.distributor) ...

    vehicle.status = status;
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Estado del vehículo actualizado correctamente.",
      data: vehicle,
    });
  } catch (error) {
    console.error("Error en updateVehicleStatusController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar estado del vehículo",
    });
  }
};

module.exports = {
  updateVehicleStatusController,
};
