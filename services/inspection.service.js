const Inspection = require("../models/Inspection");

const createInspection = async (inspectionData) => {
  const inspection = await Inspection.findOne({
    vehicleId: inspectionData.vehicleId,
  });
  if (inspection) {
    throw new Error("Inspection already exists for this vehicle");
  }

  const createdInspection = await Inspection.create(inspectionData);

  if (!createdInspection) {
    throw new Error("Failed to create inspection");
  }

  return createdInspection;
};

module.exports = { createInspection };
