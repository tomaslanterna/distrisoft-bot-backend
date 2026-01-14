const assert = require("assert");
const { Vehicle } = require("../models/Vehicle");
const { Inspection } = require("../models/Inspection");
const { Reinspection } = require("../models/Reinspection");
const {
  createInspectionController,
  verifyInspectionController,
  confirmInspectionController,
  getInspectionsByTypeController,
  getInspectionByPlateController,
  updateInspectionStatusController,
} = require("../controllers/inspection.controller");
const {
  updateVehicleStatusController,
  getVehiclesByStatusController,
} = require("../controllers/vehicle.controller");

// Flags
let vehicleFindOneCalled = false;
let vehicleSaveCalled = false;
let inspectionCreateCalled = false;
let inspectionFindByIdCalled = false;
let vehicleFindByIdCalled = false;
let inspectionFindCalled = false;
let inspectionFindOneCalled = false;
let reinspectionCreateCalled = false;
let vehicleAggregateCalled = false; // New flag

// Mock Data (same as before)
const mockUser = {
  id: "user123",
  distributor: "507f1f77bcf86cd799439011",
  distributorChannelId: "channel123",
};
const mockInspectionData = {
  matricula: "ABC1234",
  numeroChasis: "VIN123",
  marca: "Toy",
  modelo: "Cor",
  ano: "20",
  kilometros: "50000",
  componentes: {},
  componentesIncluidos: {},
  fotos: [],
  observaciones: "Ok",
};

// ... Previous Mocks ...
Vehicle.findOne = async () => ({
  _id: "v1",
  businessId: "507f1f77bcf86cd799439011",
});
Vehicle.prototype.save = async function () {
  return this;
};
Vehicle.findById = async (id) => ({
  _id: id,
  status: "PENDING_REVIEW",
  save: async () => true,
});
Inspection.create = async (data) => ({
  ...data,
  _id: "insp1",
  save: async () => true,
});
Inspection.findById = async (id) => ({
  _id: id,
  vehicleId: "v1",
  businessId: "507f1f77bcf86cd799439011",
  entityId: "channel123",
  inspectorId: "inspector123",
  inspectionType: "INSPECTION",
  save: async () => true,
});
Inspection.find = () => ({ populate: () => ({ sort: () => [] }) });
Inspection.findOne = () => ({
  populate: () => ({ sort: () => ({ _id: "insp1" }) }),
});

// MOCK Aggregate
Vehicle.aggregate = async (pipeline) => {
  vehicleAggregateCalled = true;
  console.log(
    "[Mock] Vehicle.aggregate called with pipeline length:",
    pipeline.length
  );
  // Validate pipeline structure roughly
  const matchStage = pipeline[0].$match;
  if (matchStage && matchStage.status) {
    assert.ok(matchStage.status.$in, "Status match should use $in");
    console.log("[Mock] Verified Status $in match");
  }
  // Return mock data with populates simulated
  return [
    {
      _id: "v1",
      plate: "MOCK123",
      status: "PENDING_REVIEW",
      inspections: [],
      reinspections: [],
    },
  ];
};

// MOCK Reinspection
let createdReinspectionType = null;
Reinspection.create = async (data) => {
  reinspectionCreateCalled = true;
  createdReinspectionType = data.inspectionType;
  return { ...data, _id: "reinspection_new_id" };
};

const createMockRes = (label) => ({
  status: (code) => ({
    json: (payload) => {
      if (!payload.success) console.error(`[${label}] Error:`, payload.message);
      else console.log(`[${label}] Success`);
      return payload;
    },
  }),
});

(async () => {
  console.log("=== Starting Verification ===");

  // Test 8: Get Vehicles By Status
  console.log("\n--- Test: Get Vehicles By Status ---");
  await getVehiclesByStatusController(
    {
      params: { status: "PENDING_REVIEW, REJECTED_REVIEW" },
      user: mockUser,
    },
    createMockRes("GetVehicles")
  );

  if (!vehicleAggregateCalled)
    console.error("FAILED: Vehicle.aggregate was not called.");

  console.log("\n=== Verification Complete ===");
})();
