const { Vehicle } = require("../models/Vehicle");
const { Inspection } = require("../models/Inspection");
const { Reinspection } = require("../models/Reinspection");

/**
 * Universal Search Controller
 * Searches for vehicles and in-progress inspections by plate.
 */
const universalSearchController = async (req, res) => {
  try {
    const { query } = req.body;
    const user = req.user;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un término de búsqueda (matrícula).",
      });
    }

    const businessId = user.distributorId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Usuario no asociado a un distribuidor.",
      });
    }

    // Search query for plate (case-insensitive partial match)
    const plateRegex = new RegExp(query, "i");

    // 1. Search Vehicles
    const vehicles = await Vehicle.find({
      businessId: businessId,
      plate: plateRegex,
    }).sort({ updatedAt: -1 });

    // 2. Search In-Progress Inspections
    // We search for inspections whose vehicles match the plate or search by plate indirectly
    // Since inspections are linked to vehicles, we can use the vehicle IDs found
    const vehicleIds = vehicles.map((v) => v._id);

    const inProgressInspections = await Inspection.find({
      businessId: businessId,
      vehicleId: { $in: vehicleIds },
      inspectionType: { $in: ["INSPECTION", "RE_INSPECTION"] },
    })
      .populate("vehicleId", "plate brand model year")
      .sort({ updatedAt: -1 });

    // 3. Search In-Progress Reinspections (if any)
    const inProgressReinspections = await Reinspection.find({
      businessId: businessId,
      vehicleId: { $in: vehicleIds },
      inspectionType: "RE_INSPECTION", // Only RE_INSPECTION is "in process"
    })
      .populate("vehicleId", "plate brand model year")
      .sort({ updatedAt: -1 });

    // 4. Format Results
    const results = [];

    // Format Vehicles
    vehicles.forEach((v) => {
      results.push({
        id: v._id,
        type: "VEHICLE",
        title: v.plate,
        subtitle: `${v.brand} ${v.model} (${v.year})`,
        status: v.status,
        updatedAt: v.updatedAt || v.metadata?.updatedAt,
      });
    });

    // Format Inspections
    inProgressInspections.forEach((ins) => {
      results.push({
        id: ins._id,
        type: "INSPECTION",
        title: ins.vehicleId?.plate || "S/H",
        subtitle: `Peritaje: ${ins.inspectionType}`,
        status: ins.inspectionType,
        updatedAt: ins.updatedAt || ins.createdAt,
      });
    });

    // Format Reinspections
    inProgressReinspections.forEach((re) => {
      results.push({
        id: re._id,
        type: "REINSPECTION",
        title: re.vehicleId?.plate || "S/H",
        subtitle: `Re-peritaje: ${re.inspectionType}`,
        status: re.inspectionType,
        updatedAt: re.updatedAt || re.createdAt,
      });
    });

    // Sort combined results by updatedAt descending
    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error en universalSearchController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al realizar la búsqueda universal",
    });
  }
};

module.exports = {
  universalSearchController,
};
