const assert = require("assert");
const { Vehicle } = require("../models/Vehicle");
const { Inspection } = require("../models/Inspection");
const {
  createInspectionController,
  verifyInspectionController,
  confirmInspectionController,
  getInspectionsByTypeController,
} = require("../controllers/inspection.controller");

// Flags
let vehicleFindOneCalled = false;
let vehicleSaveCalled = false;
let inspectionCreateCalled = false;
let inspectionFindByIdCalled = false;
let vehicleFindByIdCalled = false;
let inspectionFindCalled = false;

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
  return null;
};
Vehicle.prototype.save = async function () {
  vehicleSaveCalled = true;
  this._id = "vehicle_new_id_123";
  return this;
};
Vehicle.findById = async (id) => {
  vehicleFindByIdCalled = true;
  return new Vehicle({ _id: id, status: "PENDING_REVIEW", rating: 0 });
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
  // console.log(`[Mock] Inspection.find called with query: ${JSON.stringify(query)}`);

  // VERIFY QUERY STRUCTURE FOR MULTIPLE TYPES
  if (query.inspectionType && query.inspectionType.$in) {
    // Multi type check
    assert.ok(
      Array.isArray(query.inspectionType.$in),
      "InspectionType should use $in with array"
    );
    assert.ok(query.inspectionType.$in.includes("TYPE1"), "Missing TYPE1");
    assert.ok(query.inspectionType.$in.includes("TYPE2"), "Missing TYPE2");
  } else {
    // Single type check (legacy logic or simple string)
    // But our controller now Uses $in for split array always basically if passed as string
    // Actually if we pass comma string logic puts it in array
    assert.fail("Controller should convert input to $in array");
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

const createMockRes = (label) => {
  return {
    status: (code) => ({
      json: (payload) => {
        if (!payload.success)
          console.error(`[${label}] Error:`, payload.message);
        return payload;
      },
    }),
  };
};

(async () => {
  console.log("=== Starting Verification ===");

  // 4. Test Get By Type (Multiple)
  console.log(
    "\n--- Testing getInspectionsByTypeController (Multiple Types) ---"
  );
  let listPayload = null;
  const resList = {
    status: (code) => ({
      json: (payload) => {
        listPayload = payload;
        console.log(`[List] Success: ${payload.success}`);
        if (payload.success) {
          console.log(`[List] Count: ${payload.data.length}`);
        }
      },
    }),
  };

  // TEST WITH COMMA SEPARATED STRING
  await getInspectionsByTypeController(
    { params: { type: "TYPE1, TYPE2" }, user: mockUser },
    resList
  );

  if (!inspectionFindCalled)
    console.error("FAILED: Inspection.find() was not called.");
  assert.strictEqual(listPayload.data.length, 2, "Returned count mismatch");

  console.log("\n=== Verification Complete ===");
})();
