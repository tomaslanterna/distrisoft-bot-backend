const { Vehicle } = require("../models/Vehicle");
const { Inspection } = require("../models/Inspection");
const { Reinspection } = require("../models/Reinspection");

const createInspectionController = async (req, res) => {
  try {
    const { inspectionData, user } = req.body;

    // 1. Data Validation (Basic)
    if (
      !inspectionData ||
      !inspectionData.matricula ||
      !inspectionData.numeroChasis
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Datos de inspección incompletos. Matricula y Chasis son obligatorios.",
      });
    }

    // Context from User
    const businessId = user.distributor; // Assuming User.distributor is the Business ID
    const entityId = user.distributorChannelId; // Assuming this maps to entityId
    const inspectorId = user.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message:
          "Usuario no asociado a un distribuidor (Business ID faltante).",
      });
    }

    // 2. Rating Calculation
    const componentKeys = Object.keys(inspectionData.componentes || {});
    let totalScore = 0;
    const maxScorePerItem = 5;
    const totalPossibleScore = componentKeys.length * maxScorePerItem;

    const vehicleState = componentKeys.map((key) => {
      const rating = parseInt(inspectionData.componentes[key] || 0, 10);
      totalScore += rating;
      return {
        name: key,
        rating: rating,
      };
    });

    // Avoid division by zero if empty components
    let ratingPercentage = 0;
    if (totalPossibleScore > 0) {
      ratingPercentage = (totalScore / totalPossibleScore) * 100;
    }

    // 3. Vehicle Logic (Find or Create)
    let vehicle = await Vehicle.findOne({
      plate: inspectionData.matricula,
      businessId: businessId,
    });

    if (!vehicle) {
      vehicle = new Vehicle({
        businessId: businessId,
        entityId: entityId || "UNKNOWN", // Fallback if missing?
        plate: inspectionData.matricula,
        vin: inspectionData.numeroChasis,
        brand: inspectionData.marca,
        model: inspectionData.modelo,
        year: parseInt(inspectionData.ano, 10),
        status: "PENDING_REVIEW", // Initial status after inspection?
        rating: ratingPercentage, // Current rating derived from inspection
      });
    } else {
      // Update existing vehicle stats
      vehicle.rating = ratingPercentage;
      vehicle.status = "SUCCESSFULLY_REVIEW";
      // Optional: Update other fields if changed? Let's stick to core updates.
    }

    const savedVehicle = await vehicle.save();

    if (!savedVehicle) {
      throw new Error(
        "Error crítico: No se pudo crear o actualizar el vehículo. Verifique los datos."
      );
    }

    // 4. Create Inspection
    // Map componentsIncluded to Schema format
    const checklistKeys = Object.keys(
      inspectionData.componentesIncluidos || {}
    );
    const vehicleComponents = checklistKeys.map((key) => ({
      name: key,
      state: inspectionData.componentesIncluidos[key],
    }));

    // Map photos to Schema format { url, alt }
    // Assuming inspectionData.fotos is array of strings or objects?
    // Prompt says `fotos: []`. Let's assume strings for now or handle both.
    // If input is ["url1", "url2"], map to {url: "url1", alt: "Foto de inspeccion"}
    const photos = (inspectionData.fotos || []).map((foto, index) => {
      if (typeof foto === "string") {
        return { url: foto, alt: `Foto ${index + 1}` };
      }
      return { url: foto.url, alt: foto.alt || `Foto ${index + 1}` };
    });

    const newInspection = await Inspection.create({
      businessId: businessId,
      entityId: entityId || "UNKNOWN",
      vehicleId: vehicle._id,
      inspectorId: inspectorId,
      inspectionType: "INSPECTION",
      metadata: {
        mileage: parseInt(inspectionData.kilometros, 10),
        notes: inspectionData.observaciones,
        // location and externalTemp not in provided payload, skipping
      },
      vehicleState: vehicleState,
      vehicleComponents: vehicleComponents,
      photos: photos,
      // damagePoints: inspectionData.damagePoints // Not explicitly in Inspection Schema shown, skipping or adding to notes?
      // Schema didn't show 'damagePoints'. Adding to notes or ignoring.
    });

    // Update vehicle with latest inspection
    vehicle.currentInspectionId = newInspection._id;
    await vehicle.save();

    await newInspection.save();
    return res.status(201).json({
      success: true,
      message: "Inspección creada con éxito",
      data: {
        inspection: newInspection,
        vehicle: vehicle,
      },
    });
  } catch (error) {
    console.error("Error en createInspectionController:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Error interno del servidor al crear la inspección",
    });
  }
};

const verifyInspectionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionData } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de inspección es requerido.",
      });
    }

    if (!inspectionData) {
      return res.status(400).json({
        success: false,
        message: "Datos de nueva inspección son requeridos para verificar.",
      });
    }

    // 1. Fetch DB Inspection
    const dbInspection = await Inspection.findById(id);
    if (!dbInspection) {
      return res.status(404).json({
        success: false,
        message: "Inspección no encontrada.",
      });
    }

    // 2. Normalize & Calculate
    // Helper to calc rating
    const calculateRating = (componentList) => {
      let total = 0;
      const count = componentList.length;
      if (count === 0) return 0;

      componentList.forEach((c) => (total += c.rating || 0));
      return (total / (count * 5)) * 100;
    };

    // DB Data
    const dbRating = calculateRating(dbInspection.vehicleState);
    const dbMileage = dbInspection.metadata?.mileage || 0;

    // New Data
    const componentKeys = Object.keys(inspectionData.componentes || {});
    const newVehicleState = componentKeys.map((key) => ({
      name: key,
      rating: parseInt(inspectionData.componentes[key] || 0, 10),
    }));

    const checklistKeys = Object.keys(
      inspectionData.componentesIncluidos || {}
    );
    const newVehicleComponents = checklistKeys.map((key) => ({
      name: key,
      state: inspectionData.componentesIncluidos[key],
    }));

    const newRating = calculateRating(newVehicleState);
    const newMileage = parseInt(inspectionData.kilometros || 0, 10);

    // 3. Compare & Find Differences
    const differences = [];

    // Compare Rating (allow small float diff)
    if (Math.abs(dbRating - newRating) > 0.01) {
      differences.push({
        field: "rating",
        dbValue: dbRating,
        newValue: newRating,
      });
    }

    // Compare Mileage
    if (dbMileage !== newMileage) {
      differences.push({
        field: "miles",
        dbValue: dbMileage,
        newValue: newMileage,
      });
    }

    // Compare Vehicle State (Ratings)
    // Map DB state by name for easy lookup
    const dbStateMap = {};
    dbInspection.vehicleState.forEach((item) => {
      dbStateMap[item.name] = item.rating;
    });

    newVehicleState.forEach((newItem) => {
      const dbVal = dbStateMap[newItem.name];
      if (dbVal === undefined) {
        differences.push({
          field: `vehicleState.${newItem.name}`,
          dbValue: "MISSING",
          newValue: newItem.rating,
        });
      } else if (dbVal !== newItem.rating) {
        differences.push({
          field: `vehicleState.${newItem.name}`,
          dbValue: dbVal,
          newValue: newItem.rating,
        });
      }
    });

    // Check for items in DB not in New
    Object.keys(dbStateMap).forEach((key) => {
      const isInNew = newVehicleState.find((i) => i.name === key);
      if (!isInNew) {
        differences.push({
          field: `vehicleState.${key}`,
          dbValue: dbStateMap[key],
          newValue: "MISSING",
        });
      }
    });

    // Compare Vehicle Components (Boolean)
    const dbCompMap = {};
    dbInspection.vehicleComponents.forEach((item) => {
      dbCompMap[item.name] = item.state;
    });

    newVehicleComponents.forEach((newItem) => {
      const dbVal = dbCompMap[newItem.name];
      if (dbVal === undefined) {
        differences.push({
          field: `vehicleComponents.${newItem.name}`,
          dbValue: "MISSING",
          newValue: newItem.state,
        });
      } else if (dbVal !== newItem.state) {
        differences.push({
          field: `vehicleComponents.${newItem.name}`,
          dbValue: dbVal,
          newValue: newItem.state,
        });
      }
    });

    Object.keys(dbCompMap).forEach((key) => {
      const isInNew = newVehicleComponents.find((i) => i.name === key);
      if (!isInNew) {
        differences.push({
          field: `vehicleComponents.${key}`,
          dbValue: dbCompMap[key],
          newValue: "MISSING",
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        dbInspection: {
          ...dbInspection.toObject(),
          _calculatedRating: dbRating,
        },
        newInspectionData: {
          ...inspectionData,
          _calculatedRating: newRating,
          vehicleState: newVehicleState,
          vehicleComponents: newVehicleComponents,
        },
        differences,
      },
    });
  } catch (error) {
    console.error("Error en verifyInspectionController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al verificar inspección",
    });
  }
};

const confirmInspectionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionData } = req.body;

    if (!id || !inspectionData) {
      return res.status(400).json({
        success: false,
        message: "ID de inspección y datos son requeridos.",
      });
    }

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspección no encontrada.",
      });
    }

    // 1. Prepare Data
    const componentKeys = Object.keys(inspectionData.componentes || {});
    const checklistKeys = Object.keys(
      inspectionData.componentesIncluidos || {}
    );

    const vehicleState = componentKeys.map((key) => ({
      name: key,
      rating: parseInt(inspectionData.componentes[key] || 0, 10),
    }));

    const vehicleComponents = checklistKeys.map((key) => ({
      name: key,
      state: inspectionData.componentesIncluidos[key],
    }));

    // Calculate Rating
    let totalScore = 0;
    vehicleState.forEach((c) => (totalScore += c.rating));
    const maxScore = vehicleState.length * 5;
    let ratingPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    const photos = (inspectionData.fotos || []).map((foto, index) => {
      if (typeof foto === "string")
        return { url: foto, alt: `Foto ${index + 1}` };
      return { url: foto.url, alt: foto.alt || `Foto ${index + 1}` };
    });

    // 2. Update Inspection
    inspection.vehicleState = vehicleState;
    inspection.vehicleComponents = vehicleComponents;
    inspection.metadata.mileage = parseInt(inspectionData.kilometros, 10);
    inspection.metadata.notes = inspectionData.observaciones;
    inspection.photos = photos;
    inspection.inspectionType = "SUCCESSFULLY_INSPECTION";

    await inspection.save();

    // 3. Update Vehicle
    const vehicle = await Vehicle.findById(inspection.vehicleId);
    if (!vehicle) {
      throw new Error("Vehículo asociado no encontrado.");
    }

    vehicle.rating = ratingPercentage;
    vehicle.status = "SUCCESSFULLY_REVIEW"; // Mapping "confirmed" to Schema Enum

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Inspección confirmada exitosamente.",
      data: {
        inspection,
        vehicle,
      },
    });
  } catch (error) {
    console.error("Error en confirmInspectionController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al confirmar inspección",
    });
  }
};

const getInspectionsByTypeController = async (req, res) => {
  try {
    const { type } = req.params;
    const user = { ...req.user, distributor: "6963fee4005e60c8a24edf6d" };

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "El tipo de inspección es requerido.",
      });
    }

    const businessId = user.distributor;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Usuario no asociado a un distribuidor.",
      });
    }

    // Support multiple types comma-separated
    const typesArray = type.split(",").map((t) => t.trim());

    const inspections = await Inspection.find({
      inspectionType: { $in: typesArray },
      businessId: businessId,
    })
      .populate("vehicleId", "plate brand model year") // Populate basic vehicle info
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    console.error("Error en getInspectionsByTypeController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al obtener inspecciones",
    });
  }
};

const getInspectionByPlateController = async (req, res) => {
  try {
    const { plate } = req.params;
    const user = { ...req.user, distributor: "6963fee4005e60c8a24edf6d" };

    if (!plate) {
      return res.status(400).json({
        success: false,
        message: "La matrícula es requerida.",
      });
    }

    const businessId = user.distributor;

    // 1. Find Vehicle
    const vehicle = await Vehicle.findOne({
      plate: plate,
      businessId: businessId, // Ensure we only find vehicles for this distributor
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado.",
      });
    }

    // 2. Find Latest Inspection
    const inspection = await Inspection.findOne({
      vehicleId: vehicle._id,
    })
      .populate("vehicleId", "plate brand model year")
      .sort({ createdAt: -1 });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron inspecciones para este vehículo.",
      });
    }

    return res.status(200).json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    console.error("Error en getInspectionByPlateController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al obtener inspección por matrícula",
    });
  }
};

const updateInspectionStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, inspectionData } = req.body;
    const user = req.user;

    const allowedStatuses = [
      "INSPECTION",
      "RE_INSPECTION",
      "REJECTED_INSPECTION",
      "SUCCESSFULLY_INSPECTION",
    ];

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "ID de inspección y estado son requeridos.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Permitidos: ${allowedStatuses.join(", ")}`,
      });
    }

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspección no encontrada.",
      });
    }

    // Update status
    inspection.inspectionType = status;
    await inspection.save();

    // Create Reinspection if data provided

    // Create Reinspection if data provided
    if (inspectionData) {
      // Map components
      const componentKeys = Object.keys(inspectionData.componentes || {});
      const vehicleState = componentKeys.map((key) => ({
        name: key,
        rating: parseInt(inspectionData.componentes[key] || 0, 10),
      }));

      const checklistKeys = Object.keys(
        inspectionData.componentesIncluidos || {}
      );
      const vehicleComponents = checklistKeys.map((key) => ({
        name: key,
        state: inspectionData.componentesIncluidos[key],
      }));

      let reinspectionType = "SUCCESSFULLY_REINSPECTION"; // Default valid

      if (status === "REJECTED_INSPECTION") {
        reinspectionType = "REJECTED_REINSPECTION";
      } else if (status === "SUCCESSFULLY_INSPECTION") {
        reinspectionType = "SUCCESSFULLY_REINSPECTION";
      } else {
        // Fallback for other statuses like RE_INSPECTION or if we want to default to something else?
        // User said: "when REJECTED... REJECTED_REINSPECTION and when SUCCESSFULLY... SUCCESSFULLY_REINSPECTION".
        // The endpoint allows RE_INSPECTION too.
        // If status is RE_INSPECTION, user didn't specify. Assuming "RE_INSPECTION" type or staying successful?
        // Previously mapped RE_INSPECTION -> RE_INSPECTION.
        // Let's assume conditional maps strictly as requested and handle others.
        // User instruction: "cuando es REJECTED... REJECTED... y cuando es SUCCESSFULLY... SUCCESSFULLY...".
        // What if it is `RE_INSPECTION`? The curl example used `RE_INSPECTION`.
        // I should probably support it or default?
        // Let's keep supporting RE_INSPECTION mapping if existing, or just default to logic requested.
        // User request is specific about the two outcome states.

        // Let's use a clear map.
        if (status === "RE_INSPECTION") reinspectionType = "RE_INSPECTION";
      }

      await Reinspection.create({
        inspectionId: inspection._id,
        businessId: inspection.businessId,
        entityId: inspection.entityId,
        vehicleId: inspection.vehicleId,
        inspectorId: user?.id || inspection.inspectorId, // fallback
        inspectionType: reinspectionType,
        metadata: {
          mileage: parseInt(inspectionData.kilometros || 0, 10),
          notes: inspectionData.observaciones,
        },
        vehicleState: vehicleState,
        vehicleComponents: vehicleComponents,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Estado de inspección actualizado correctamente.",
      data: inspection,
    });
  } catch (error) {
    console.error("Error en updateInspectionStatusController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar estado de la inspección",
    });
  }
};

module.exports = {
  createInspectionController,
  verifyInspectionController,
  confirmInspectionController,
  getInspectionsByTypeController,
  getInspectionByPlateController,
  updateInspectionStatusController,
};
