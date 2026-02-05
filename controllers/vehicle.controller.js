const { Vehicle } = require("../models/Vehicle");
const mongoose = require("mongoose");

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
    const user = req.user;

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
      (s) => !allowedStatuses.includes(s),
    );
    if (invalidStatuses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Estados inválidos encontrados: ${invalidStatuses.join(
          ", ",
        )}. Permitidos: ${allowedStatuses.join(", ")}`,
      });
    }

    // Determine Business Context
    const businessId = user.distributorId;

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

const getVehiclesByFilterController = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const user = req.user;

    const query = {};

    // 1. Business Context
    const businessId = user.distributorId;
    if (businessId) {
      query.businessId = new mongoose.Types.ObjectId(businessId);
    }

    // 2. Status Filter
    if (status) {
      const requestedStatuses = status.split(",").map((s) => s.trim());
      const allowedStatuses = [
        "PENDING_REVIEW",
        "REJECTED_REVIEW",
        "SUCCESSFULLY_REVIEW",
      ];
      const invalidStatuses = requestedStatuses.filter(
        (s) => !allowedStatuses.includes(s),
      );

      if (invalidStatuses.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Estados inválidos: ${invalidStatuses.join(", ")}`,
        });
      }
      query.status = { $in: requestedStatuses };
    }

    // 3. Date Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Ajustar endDate para que incluya todo el día si es solo fecha YYYY-MM-DD
        // Si ya viene con hora, se respeta.
        // Asumimos que si el usuario manda "2023-10-10", quiere decir hasta el final de ese día o inicio?
        // Standard: $lte matches exactly.
        const end = new Date(endDate);
        // If exact time provided, use it. If simply date, maybe logic needed?
        // Let's stick to simple provided date object for now.
        query.createdAt.$lte = end;
      }
    }

    // Aggregation Pipeline
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "inspections",
          localField: "_id",
          foreignField: "vehicleId",
          as: "inspections",
        },
      },
      {
        $lookup: {
          from: "reinspections",
          localField: "_id",
          foreignField: "vehicleId",
          as: "reinspections",
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const vehicles = await Vehicle.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error en getVehiclesByFilterController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al filtrar vehículos.",
    });
  }
};

module.exports = {
  updateVehicleStatusController,
  getVehiclesByStatusController,
  getVehiclesByFilterController,
};
