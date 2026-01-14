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

const getVehiclesByStatusController = async (req, res) => {
  try {
    const { status } = req.params;
    const user = { ...req.user, distributor: "6963fee4005e60c8a24edf6d" };

    // Validate Input Status
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "El parámetro de estado es requerido.",
      });
    }

    const requestedStatuses = status.split(",").map((s) => s.trim());
    const allowedStatuses = [
      "PENDING_REVIEW",
      "REJECTED_REVIEW",
      "SUCCESSFULLY_REVIEW",
    ];

    if (requestedStatuses.length > 3) {
      return res.status(400).json({
        success: false,
        message: "No se permiten más de 3 estados a la vez.",
      });
    }

    // Validate if any requested status is invalid
    const invalidStatuses = requestedStatuses.filter(
      (s) => !allowedStatuses.includes(s)
    );
    if (invalidStatuses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Estados inválidos encontrados: ${invalidStatuses.join(
          ", "
        )}. Permitidos: ${allowedStatuses.join(", ")}`,
      });
    }

    // Determine Business Context
    const businessId = user.distributor;

    // Aggregation Pipeline
    const pipeline = [
      {
        $match: {
          status: { $in: requestedStatuses },
        },
      },
    ];

    if (businessId) {
      const mongoose = require("mongoose");
      pipeline[0].$match.businessId = new mongoose.Types.ObjectId(businessId);
    }

    // Lookup Inspections
    pipeline.push({
      $lookup: {
        from: "inspections",
        localField: "_id",
        foreignField: "vehicleId",
        as: "inspections",
      },
    });

    // Lookup Reinspections
    pipeline.push({
      $lookup: {
        from: "reinspections",
        localField: "_id",
        foreignField: "vehicleId",
        as: "reinspections",
      },
    });

    // Sort descending by creation
    pipeline.push({ $sort: { createdAt: -1 } });

    const vehicles = await Vehicle.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error en getVehiclesByStatusController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al obtener vehículos por estado.",
    });
  }
};

module.exports = {
  updateVehicleStatusController,
  getVehiclesByStatusController,
};
