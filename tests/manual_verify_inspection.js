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

// Mock Data
const mockUser = {
  id: "user123",
  distributor: "distributor123",
  distributorChannelId: "channel123",
};

const mockInspectionData = {
  matricula: "ABC1234",
  numeroChasis: "VIN123456789",
  marca: "Toyota",
  modelo: "Corolla",
  ano: "2020",
  kilometros: "50000",
  componentes: {
    pintura: 4,
    chapa: 5,
    motor: 5,
  },
  componentesIncluidos: {
    radio: true,
    gato: false,
  },
  fotos: ["http://example.com/photo1.jpg"],
  observaciones: "Todo ok",
};

// ... Previous Mocks ...
Vehicle.findOne = async ({ plate, businessId }) => {
  vehicleFindOneCalled = true;
  if (plate && businessId) {
    return { _id: "vehicle_id_123", plate, businessId };
  }
  return null;
};
Vehicle.prototype.save = async function () {
  vehicleSaveCalled = true;
  this._id = "vehicle_new_id_123";
  return this;
};
Vehicle.findById = async (id) => {
  vehicleFindByIdCalled = true;
  return {
    _id: id,
    status: "PENDING_REVIEW",
    save: async function () {
      return true;
    },
  };
};

Inspection.create = async (data) => {
  inspectionCreateCalled = true;
  return { ...data, _id: "inspection_created_id", save: async () => true };
};

Inspection.findById = async (id) => {
  inspectionFindByIdCalled = true;
  return {
    _id: id,
    vehicleId: "vehicle_new_id_123",
    businessId: "distributor123",
    entityId: "channel123",
    inspectorId: "inspector123",
    inspectionType: "INSPECTION",
    toObject: () => ({ _id: id }),
    metadata: { mileage: 50000 },
    vehicleState: [
      { name: "pintura", rating: 4 },
      { name: "chapa", rating: 5 },
      { name: "motor", rating: 5 },
    ],
    vehicleComponents: [
      { name: "radio", state: true },
      { name: "gato", state: false },
    ],
    save: async function () {
      // console.log(`[Mock] Inspection.save. Type: ${this.inspectionType}`);
    },
  };
};

Inspection.find = (query) => {
  if (query.inspectionType && query.inspectionType.$in) {
    assert.ok(
      Array.isArray(query.inspectionType.$in),
      "InspectionType should use $in with array"
    );
  }
  assert.strictEqual(query.businessId, "distributor123");
  inspectionFindCalled = true;
  return {
    populate: (field) => {
      return {
        sort: (sort) => {
          return [
            { _id: "insp1", inspectionType: "TYPE1" },
            { _id: "insp2", inspectionType: "TYPE2" },
          ];
        },
      };
    },
  };
};

Inspection.findOne = (query) => {
  if (query.vehicleId === "vehicle_id_123") inspectionFindOneCalled = true;
  return {
    populate: (field) => {
      return {
        sort: (sort) => {
          return { _id: "latest_insp_id_999", plate: "ABC1234" };
        },
      };
    },
  };
};

Reinspection.create = async (data) => {
  reinspectionCreateCalled = true;
  // Assertion updated: MUST be SUCCESSFULLY_REINSPECTION always
  assert.strictEqual(
    data.inspectionType,
    "SUCCESSFULLY_REINSPECTION",
    "Reinspection Type Mismatch"
  );
  assert.strictEqual(data.metadata.mileage, 50000);
  return { ...data, _id: "reinspection_new_id" };
};

const createMockRes = (label) => {
  return {
    status: (code) => ({
      json: (payload) => {
        if (!payload.success)
          console.error(`[${label}] Error:`, payload.message);
        console.log(`[${label}] Success: ${payload.success}`);
        return payload;
      },
    }),
  };
};

(async () => {
  console.log("=== Starting Verification ===");

  // 6. Test Update Inspection Status with Reinspection
  console.log(
    "\n--- Testing updateInspectionStatusController (Reinspection) ---"
  );
  const resInspStatus = createMockRes("InspStatus");
  let inspStatusPayload = await updateInspectionStatusController(
    {
      params: { id: "insp_1" },
      body: {
        status: "RE_INSPECTION",
        inspectionData: mockInspectionData,
      },
      user: mockUser,
    },
    resInspStatus
  );

  if (!reinspectionCreateCalled)
    console.error("FAILED: Reinspection.create was not called.");

  // 7. Test Update Vehicle Status
  console.log("\n--- Testing updateVehicleStatusController ---");
  const resVehStatus = createMockRes("VehStatus");
  let vehStatusPayload = await updateVehicleStatusController(
    { params: { id: "veh_1" }, body: { status: "REJECTED_REVIEW" } },
    resVehStatus
  );

  console.log("\n=== Verification Complete ===");
})();
