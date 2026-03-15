const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const { Vehicle } = require("../models/Vehicle");
const { Inspection } = require("../models/Inspection");
const { Reinspection } = require("../models/Reinspection");
const { callGeminiWithRetry } = require("../services/gemini.service");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const calculateInspectionRatings = (
  componentList,
  checklistList,
  feChecklistRating = null,
) => {
  // 1. Calculate Star Rating (Average of 1-5 stars)
  let totalStars = 0;
  const starCount = componentList.length;
  let starRating = 0;

  if (starCount > 0) {
    componentList.forEach((c) => (totalStars += c.rating || 0));
    starRating = totalStars / starCount;
  }

  // 2. Calculate Checklist Rating
  // Formula: (Count of items with state 1 / Total items selected) * 5
  // state 1 = OK, state 2 = Issues (Bad)
  let checklistRating = 0;
  const checklistCount = checklistList.length;

  if (checklistCount > 0) {
    const okCount = checklistList.filter((c) => c.state === 1).length;
    const checklistCalculatedRating = (okCount / checklistCount) * 5;
    checklistRating = feChecklistRating
      ? (checklistCalculatedRating + feChecklistRating) / 2
      : checklistCalculatedRating;
  }

  // 3. Calculate Overall Rating
  // Average of Star Rating and Checklist Rating
  let overallRating = 0;
  if (starCount > 0 && checklistCount > 0) {
    overallRating = (starRating + checklistRating) / 2;
  } else if (starCount > 0) {
    overallRating = starRating;
  } else if (checklistCount > 0) {
    overallRating = checklistRating;
  }

  return { starRating, checklistRating, overallRating };
};

const createInspectionController = async (req, res) => {
  try {
    let { inspectionData } = req.body;

    // Si la data viene como JSON string desde multipart/form-data
    if (typeof inspectionData === "string") {
      try {
        inspectionData = JSON.parse(inspectionData);
      } catch (e) {
        if (req.files) {
          req.files.forEach(
            (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
          );
        }
        return res
          .status(400)
          .json({ success: false, message: "Invalid JSON in inspectionData." });
      }
    }

    const ObjectData = typeof inspectionData === "object" ? inspectionData : {};
    const user = req.user;

    // 1. Data Validation (Basic)
    if (!ObjectData || !ObjectData.matricula || !ObjectData.numeroChasis) {
      if (req.files) {
        req.files.forEach(
          (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
        );
      }
      return res.status(400).json({
        success: false,
        message:
          "Datos de inspección incompletos. Matricula y Chasis son obligatorios.",
      });
    }

    // Context from User
    const businessId = user.distributorId; // Assuming User.distributor is the Business ID
    const entityId = user.distributorChannelId; // Assuming this maps to entityId
    const inspectorId = user.id;

    if (!businessId) {
      if (req.files) {
        req.files.forEach(
          (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
        );
      }
      return res.status(400).json({
        success: false,
        message:
          "Usuario no asociado a un distribuidor (Business ID faltante).",
      });
    }

    // 3. Vehicle Logic (Find or Create)
    // Create new inspection objects first to calculate rating
    // then use that rating for vehicle creation/update

    // Map components (Stars)
    const componentKeys = Object.keys(ObjectData.componentes || {});
    const vehicleState = componentKeys.map((key) => {
      const rating = parseInt(ObjectData.componentes[key] || 0, 10);
      return {
        name: key,
        rating: rating,
      };
    });

    // Map componentsIncluded to Schema format
    const checklistKeys = Object.keys(ObjectData.componentesIncluidos || {});
    const vehicleComponents = checklistKeys.map((key) => {
      const val = parseInt(ObjectData.componentesIncluidos[key], 10);
      return {
        name: key,
        state: isNaN(val) ? 0 : val,
      };
    });

    const { starRating, checklistRating, overallRating } =
      calculateInspectionRatings(
        vehicleState,
        vehicleComponents,
        ObjectData.ratingComponentes,
      );

    let vehicle = await Vehicle.findOne({
      plate: ObjectData.matricula,
      businessId: businessId,
    });

    if (!vehicle) {
      vehicle = new Vehicle({
        businessId: businessId,
        entityId: entityId || "UNKNOWN", // Fallback if missing?
        plate: ObjectData.matricula,
        vin: ObjectData.numeroChasis,
        brand: ObjectData.marca,
        model: ObjectData.modelo,
        year: parseInt(ObjectData.ano, 10),
        status: "PENDING_REVIEW", // Initial status after inspection?
        rating: overallRating, // Use overall rating
      });
    } else {
      // Update existing vehicle stats
      vehicle.rating = overallRating;
      vehicle.status = "SUCCESSFULLY_REVIEW";
      // Optional: Update other fields if changed? Let's stick to core updates.
    }

    const savedVehicle = await vehicle.save();

    if (!savedVehicle) {
      if (req.files) {
        req.files.forEach(
          (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
        );
      }
      throw new Error(
        "Error crítico: No se pudo crear o actualizar el vehículo. Verifique los datos.",
      );
    }

    // 4. Create Inspection Photos Array
    let photos = [];

    // Fallback: Si se envían URLs previas (ej: desde IA), las mapeamos primero
    const fallbackPhotos = ObjectData.fotos || [];
    photos = fallbackPhotos.map((foto, index) => {
      if (typeof foto === "string") {
        return { url: foto, alt: `Foto ${index + 1}` };
      }
      return { url: foto.url, alt: foto.alt || `Foto ${index + 1}` };
    });

    // Si además vienen fotos adjuntas, las guardamos y las agreamos
    if (req.files && req.files.length > 0) {
      const uploadDir = path.join(__dirname, "..", "public", "images");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPromises = req.files.map(async (file, index) => {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(file.path)
          .resize({ width: 1024, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        let baseUrl = `${req.protocol}://${req.get("host")}`;
        if (process.env.NODE_ENV === "development") {
          baseUrl = "http://localhost:3000";
        }

        return {
          url: `${baseUrl}/images/${filename}`,
          alt: `Foto Adicional ${photos.length + index + 1}`,
        };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      photos = [...photos, ...uploadedPhotos];

      // Limpiar temporales
      req.files.forEach(
        (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
      );
    }

    const newInspection = await Inspection.create({
      businessId: businessId,
      entityId: entityId || "UNKNOWN",
      vehicleId: vehicle._id,
      inspectorId: inspectorId,
      inspectionType: "INSPECTION",
      metadata: {
        mileage: parseInt(ObjectData.kilometros, 10),
        notes: ObjectData.observaciones,
        // location and externalTemp not in provided payload, skipping
      },
      checklistRating: checklistRating,
      overallRating: overallRating,
      vehicleState: vehicleState,
      vehicleComponents: vehicleComponents,
      photos: photos,
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
    if (req.files) {
      req.files.forEach(
        (file) => fs.existsSync(file.path) && fs.unlinkSync(file.path),
      );
    }
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
    // 2. Normalize & Calculate

    // Re-calculate DB Rating to ensure consistency with new logic
    // Even if DB has old rating, we recalculate for comparison
    const { overallRating: dbRating } = calculateInspectionRatings(
      dbInspection.vehicleState,
      dbInspection.vehicleComponents,
      dbInspection.checklistRating,
    );
    const dbMileage = dbInspection.metadata?.mileage || 0;

    // New Data
    const componentKeys = Object.keys(inspectionData.componentes || {});
    const newVehicleState = componentKeys.map((key) => ({
      name: key,
      rating: parseInt(inspectionData.componentes[key] || 0, 10),
    }));

    const checklistKeys = Object.keys(
      inspectionData.componentesIncluidos || {},
    );
    const newVehicleComponents = checklistKeys.map((key) => {
      const val = parseInt(inspectionData.componentesIncluidos[key], 10);
      return {
        name: key,
        state: isNaN(val) ? 0 : val,
      };
    });

    const { overallRating: newRating } = calculateInspectionRatings(
      newVehicleState,
      newVehicleComponents,
      inspectionData.ratingComponentes,
    );
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
      inspectionData.componentesIncluidos || {},
    );

    const vehicleState = componentKeys.map((key) => ({
      name: key,
      rating: parseInt(inspectionData.componentes[key] || 0, 10),
    }));

    const vehicleComponents = checklistKeys.map((key) => {
      const val = parseInt(inspectionData.componentesIncluidos[key], 10);
      return {
        name: key,
        state: isNaN(val) ? 0 : val,
      };
    });

    const { starRating, checklistRating, overallRating } =
      calculateInspectionRatings(
        vehicleState,
        vehicleComponents,
        inspectionData.ratingComponentes,
      );
    const ratingPercentage = overallRating; // Use overall rating as the vehicle score

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
    inspection.checklistRating = checklistRating;
    inspection.overallRating = overallRating;

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
    const user = req.user;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "El tipo de inspección es requerido.",
      });
    }

    const businessId = user.distributorId;

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
    const user = req.user;

    if (!plate) {
      return res.status(400).json({
        success: false,
        message: "La matrícula es requerida.",
      });
    }

    const businessId = user.distributorId;

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
        inspectionData.componentesIncluidos || {},
      );
      const vehicleComponents = checklistKeys.map((key) => {
        const val = parseInt(inspectionData.componentesIncluidos[key], 10);
        return {
          name: key,
          state: isNaN(val) ? 0 : val,
        };
      });

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

      const { checklistRating, overallRating } = calculateInspectionRatings(
        vehicleState,
        vehicleComponents,
        inspectionData.ratingComponentes,
      );

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
        checklistRating: checklistRating,
        overallRating: overallRating,
        vehicleState: vehicleState,
        vehicleComponents: vehicleComponents,
      });

      // Update vehicle rating as well?
      // Usually reinspection updates vehicle state
      // Let's update vehicle rating to match reinspection
      const vehicle = await Vehicle.findById(inspection.vehicleId);
      if (vehicle) {
        vehicle.rating = overallRating;
        await vehicle.save();
      }
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

const getInspectionsByFilterController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user;

    const query = {
      businessId: user.distributorId,
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const inspections = await Inspection.find(query)
      .populate("vehicleId", "plate brand model year")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    console.error("Error en getInspectionsByFilterController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al filtrar inspecciones.",
    });
  }
};

const getReinspectionsByFilterController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user;

    const query = {
      businessId: user.distributorId,
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const reinspections = await Reinspection.find(query)
      .populate("vehicleId", "plate brand model year")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reinspections,
    });
  } catch (error) {
    console.error("Error en getReinspectionsByFilterController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al filtrar reinspecciones.",
    });
  }
};

const updateReinspectionStateController = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleState, vehicleComponents, vehicleBills, vehicleId } =
      req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de reinspección es requerido.",
      });
    }

    if (!vehicleState || !vehicleComponents) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere vehicleState y vehicleComponents para actualizar.",
      });
    }

    const reinspection = await Reinspection.findById(id);

    if (!reinspection) {
      return res.status(404).json({
        success: false,
        message: "Reinspección no encontrada.",
      });
    }

    let changesMade = [];

    if (vehicleState) {
      vehicleState.forEach((newStateItem) => {
        const existingItemIndex = reinspection.vehicleState.findIndex(
          (item) => item.name === newStateItem.name,
        );
        if (existingItemIndex > -1) {
          const oldRating = reinspection.vehicleState[existingItemIndex].rating;
          if (oldRating !== newStateItem.rating) {
            changesMade.push(
              `Estado de '${newStateItem.name}' cambió de ${oldRating} a ${newStateItem.rating}`,
            );
            reinspection.vehicleState[existingItemIndex].rating =
              newStateItem.rating;
            reinspection.vehicleState[existingItemIndex].isNewValue = true;
          }
        } else {
          changesMade.push(
            `Se agregó estado '${newStateItem.name}' con valor ${newStateItem.rating}`,
          );
          reinspection.vehicleState.push({
            ...newStateItem,
            isNewValue: true,
          });
        }
      });
    }

    if (vehicleComponents) {
      vehicleComponents.forEach((newCompItem) => {
        const existingItemIndex = reinspection.vehicleComponents.findIndex(
          (item) => item.name === newCompItem.name,
        );
        if (existingItemIndex > -1) {
          const oldState =
            reinspection.vehicleComponents[existingItemIndex].state;
          if (oldState !== newCompItem.state) {
            changesMade.push(
              `Componente '${newCompItem.name}' cambió de ${oldState} a ${newCompItem.state}`,
            );
            reinspection.vehicleComponents[existingItemIndex].state =
              newCompItem.state;
            reinspection.vehicleComponents[existingItemIndex].isNewValue = true;
          }
        } else {
          changesMade.push(
            `Se agregó componente '${newCompItem.name}' con estado ${newCompItem.state}`,
          );
          reinspection.vehicleComponents.push({
            ...newCompItem,
            isNewValue: true,
          });
        }
      });
    }

    if (changesMade.length > 0) {
      if (!reinspection.history) {
        reinspection.history = [];
      }
      reinspection.history.push({
        userId: req.user ? req.user.id : null,
        changedAt: new Date(),
        changes: changesMade.join(" | "),
      });
    }

    await reinspection.save();

    if (vehicleBills && Array.isArray(vehicleBills) && vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle) {
        if (!vehicle?.vehicleBills) {
          vehicle.vehicleBills = [];
        } else {
          vehicle.vehicleBills.push(...vehicleBills);
        }
        await vehicle.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reinspección actualizada correctamente.",
      data: reinspection,
    });
  } catch (error) {
    console.error("Error en updateReinspectionStateController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar la reinspección.",
    });
  }
};

const analyzePhotosController = async (req, res) => {
  try {
    const user = req.user;

    const businessId = user?.distributorId;
    const entityId = user?.distributorChannelId;
    const inspectorId = user?.id;

    if (!businessId) {
      // Limpiar archivos subidos en caso de error
      if (req.files) {
        if (req.files.photos)
          req.files.photos.forEach(
            (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
          );
        if (req.files.audio)
          req.files.audio.forEach(
            (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
          );
      }
      return res.status(400).json({
        success: false,
        message: "Usuario no asociado a un distribuidor.",
      });
    }

    const photos = req.files?.photos || [];
    const audios = req.files?.audio || [];

    if (photos.length < 6) {
      if (req.files) {
        if (req.files.photos)
          req.files.photos.forEach(
            (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
          );
        if (req.files.audio)
          req.files.audio.forEach(
            (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
          );
      }
      return res.status(400).json({
        success: false,
        message:
          "Se requieren al menos 6 fotos para realizar el análisis inteligente.",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json", // Esto obliga a la IA a devolver un JSON válido
      },
      tools: [{ googleSearch: {} }],
    });

    // Preparar el System Prompt
    //     const systemPrompt = `Eres un "Analizador Inteligente de Peritajes" de vehículos.
    // Analizarás un conjunto de imágenes (y opcionalmente un audio del motor) proporcionados por el usuario para extraer información estructurada que servirá de borrador para una inspección.

    // **INSTRUCCIONES DE ANÁLISIS:**
    // 1. **Análisis de Documentación:** Busca la placa (patente), marca y modelo del vehículo.
    // *Nota crucial:* Si entre las fotos detectas la foto de la libreta de propiedad, título y/o documento de identidad del vehículo, **DEBES usar ESA foto como la fuente principal y definitiva** para extraer la placa, marca, modelo y VIN, descartando otras inferencias del exterior del vehículo si hubiera discrepancias.
    // *Nota para documentos:* En la libreta, el dato que buscas siempre se encuentra al lado de un label identificador. Debes buscar específicamente en el texto frases como "Matrícula", "Año", o "Nro Chasis" para identificar a qué campo corresponde el valor que le sigue.
    // *Nota importante:* El número de chasis (VIN) es opcional. Si se detecta, extráelo; si no es visible o legible, déjalo como un string vacío "" sin marcar error.
    // 2. **Análisis de Odómetro:** Extrae el kilometraje numérico exacto visible en el tablero. Si es digital, valida los dígitos; si es analógico, estima con precisión.
    // 3. **Valoración de Estado (vehicleState):** Evalúa visualmente (y mediante el audio para el motor, si está presente) y asigna un "rating" (entero del 0 al 5, donde 5 es perfecto y 0 es en pésimo estado) estrictamente a estas partes (usa exactamente estos nombres en el atributo 'name'):
    // - pintura, chapa, cubiertas, parabrisas, tapizado, motor, embrage, caja, trenDelantero, trenTrasero, amortiguadores, frenos, frenoMano, lucesTablero, bateria.
    // *IMPORTANTE PARA INTERIOR Y EXTERIOR:* Ten en cuenta el nivel de limpieza general del vehículo. Que un auto esté sucio (barro, polvo) o su interior esté manchado NO significa necesariamente que esté en mal estado (como chapa oxidada, pintura descascarada o plásticos rotos). Diferencia entre suciedad y daño estructural o de desgaste. Enfócate exclusivamente en valorar los desgastes permanentes, rayones, roturas y qué componentes estructurales tiene.
    // *IMPORTANTE PARA TABLERO:* Al examinar el tablero, ten en cuenta que encendidas luces de color amarillo no siempre indican errores graves o mal estado del motor. Por ejemplo, la luz de reserva de combustible es un aviso informativo. Debes identificar íconos universales de automóviles apoyándote de internet si es necesario para categorizar correctamente si es un error grave o no y valorar en base a eso.
    // *IMPORTANTE:* Para los componentes que NO puedas percibir, ver o evaluar claramente en las fotos proporcionadas (porque no hay ángulo, foto faltante, etc), asígnales estrictamente el valor de rating \`0\`.
    // ${audios.length === 0 ? "*IMPORTANTE: Como NO se adjuntó archivo de audio, el sonido no pudo ser evaluado. Debes obligatoriamente dejar el valor de 'rating' como `null` para: 'motor', 'embrage' y 'caja', de modo que los recuadros queden vacíos para revisión manual.*" : "*IMPORTANTE: Se ha adjuntado un archivo de audio. Escúchalo determinadamente para evaluar ruidos anormales del 'motor', 'embrage' y 'caja', asignándoles su respectivo 'rating'.*"}
    // 4. **Checklist de Componentes (vehicleComponents):** Identifica la presencia de estrictamente estos componentes (usa exactamente estos nombres en el atributo 'name'):
    // - aa, da, airbags, radio, vidriosElectricos, techoPanoramico, alfombras, alarma, bloqueo, llave1, llave2, control1, control2, llantas, tazas, estribos, barraAntiVuelco, barrasTecho, defensa, enganche, traccion4x4, lonaMaritima, cubreCaja, auxiliar, llave, gato, computest.
    // *Importante:* Usa el ENUM para 'state': 0 (No tiene/No detectado), 1 (Tiene y está OK), 2 (Tiene pero Dudoso/Requiere revisión manual).
    // 5. **Generación de Alt Text:** Para cada imagen, crea una descripción técnica corta en español (ej: "Foto de perfil lateral derecho con rayón leve en puerta trasera").
    // 6. **Valoración de Mercado:** Busca en internet el valor aproximado de venta del vehículo en la actualidad (teniendo en cuenta la marca, modelo, año estimado, estado general del vehículo y kilometros) y retórnalo estrictamente como un número en la propiedad "totalValue", puedes apoyarte para estos valores buscando en mercado libre por ejemplo. Si no puedes encontrar un precio exacto, haz tu mejor estimación numérica.

    // **ESTRUCTURA DE RESPUESTA REQUERIDA:**
    // Debes devolver **EXCLUSIVAMENTE** un string en formato JSON válido que coincida exactamente con la siguiente estructura. No incluyas bloques de código markdown, ni saludos, ni ningún otro texto fuera del JSON.

    // {
    //   "metadata": {
    //     "mileage": Number,
    //     "location": String o null,
    //     "notes": "Informe preliminar generado por IA basado en el análisis de las fotos y audio."
    //   },
    //   "vehicle": {
    //     "brand": String,
    //     "model": String,
    //     "plate": String,
    //     "vin": String || ""
    //   },
    //   "totalValue": Number,
    //   "vehicleState": [
    //     { "name": "pintura", "rating": Number },
    //     { "name": "chapa", "rating": Number },
    //     { "name": "cubiertas", "rating": Number },
    //     { "name": "parabrisas", "rating": Number },
    //     { "name": "tapizado", "rating": Number },
    //     { "name": "motor", "rating": "Number o null" },
    //     { "name": "embrage", "rating": "Number o null" },
    //     { "name": "caja", "rating": "Number o null" },
    //     { "name": "trenDelantero", "rating": Number },
    //     { "name": "trenTrasero", "rating": Number },
    //     { "name": "amortiguadores", "rating": Number },
    //     { "name": "frenos", "rating": Number },
    //     { "name": "frenoMano", "rating": Number },
    //     { "name": "lucesTablero", "rating": Number },
    //     { "name": "bateria", "rating": Number }
    //   ],
    //   "vehicleComponents": [
    //     { "name": "aa", "state": Number },
    //     { "name": "da", "state": Number },
    //     { "name": "airbags", "state": Number },
    //     { "name": "radio", "state": Number },
    //     { "name": "vidriosElectricos", "state": Number },
    //     { "name": "techoPanoramico", "state": Number },
    //     { "name": "alfombras", "state": Number },
    //     { "name": "alarma", "state": Number },
    //     { "name": "bloqueo", "state": Number },
    //     { "name": "llave1", "state": Number },
    //     { "name": "llave2", "state": Number },
    //     { "name": "control1", "state": Number },
    //     { "name": "control2", "state": Number },
    //     { "name": "llantas", "state": Number },
    //     { "name": "tazas", "state": Number },
    //     { "name": "estribos", "state": Number },
    //     { "name": "barraAntiVuelco", "state": Number },
    //     { "name": "barrasTecho", "state": Number },
    //     { "name": "defensa", "state": Number },
    //     { "name": "enganche", "state": Number },
    //     { "name": "traccion4x4", "state": Number },
    //     { "name": "lonaMaritima", "state": Number },
    //     { "name": "cubreCaja", "state": Number },
    //     { "name": "auxiliar", "state": Number },
    //     { "name": "llave", "state": Number },
    //     { "name": "gato", "state": Number },
    //     { "name": "computest", "state": Number }
    //   ],
    //   "photos": [
    //     { "url": "", "alt": "Descripción corta generada para la foto 1" },
    //     { "url": "", "alt": "Descripción corta generada para la foto 2" }
    //   ]
    // }`;

    const systemPrompt = `
Eres el "Analizador Inteligente de Peritajes" de nivel experto. Tu misión es transformar imágenes y audio en un informe técnico de alta precisión.

PROTOCOLO DE VERIFICACIÓN VISUAL (CRITERIOS DE INSPECCIÓN)

Para cada campo, aplica los siguientes criterios antes de calificar:

- Pintura y Chapa: Busca falta de brillo, "piel de naranja" (repintado), rayones profundos (que llegan al metal), abolladuras en nervaduras y diferencias de tono entre paneles. No penalices por suciedad superficial.

- Motor (Visual): Busca manchas de aceite frescas (brillantes), depósitos blanquecinos en bornes de batería, mangueras resecas o con grietas, y niveles de fluidos si son visibles.

- Tablero y Luces: 
* Rojo Crítico (Falla grave): Iconos de Presión de aceite, Temperatura del refrigerante, Sistema de Carga/Batería o Sistema de Frenos (falla hidráulica). Baja el rating a 1 o 2.

* Rojo Informativo (Estado/Seguridad): Iconos de Cinturón de seguridad desabrochado, Freno de mano colocado/activo o Puertas abiertas. No baja el rating.

* Amarillo/Ámbar (Advertencia): Check Engine, ABS, Airbag, EPC, o Control de Tracción. Baja el rating a 3.

* Informativo (General): Reserva de combustible, Luces encendidas, Control de crucero o ECO. No baja el rating.

- Cubiertas: Observa la profundidad del dibujo y el estado de los flancos (sin "huevos" o cortes). 5 = Dibujo profundo, 1 = Lisa/Testigo de desgaste alcanzado.

- Interior y Equipamiento (Tapizado): Realiza un barrido visual completo de la cabina. No te limites a las manchas en los asientos; inspecciona paneles de puertas, techo, consola central y comandos.

* Identifica presencia de: espejos eléctricos (joysticks en puertas), bloqueo central, tipo de radio (pantalla, táctil o analógica), y estado general de plásticos.

* Califica el "tapizado" basándote en la integridad de las costuras, quemaduras y desgaste de los pétalos laterales.

INSTRUCCIONES DE ANÁLISIS POR CAPAS:

- CAPA 1: Identificación Definitiva (Documentación)

* Prioridad Máxima: Si detectas fotos de "Libreta de Propiedad", "Título" o "Cédula", extrae de ahí: plate (matrícula), brand, model, year y vin. Estos datos invalidan cualquier inferencia visual externa.

* Ubicación de Datos: En los documentos, busca los valores que se encuentran inmediatamente al lado o debajo de etiquetas como: "Matrícula", "Nro. de Chasis", "Año/Modelo", "Marca".

* VIN (Chasis): Es opcional. Si no es 100% legible, devuelve "".

*Location: Obtene la location en base a la "matricula" del mismo, busca el formato en internet y determina en base a que "matricula" es de donde es

- CAPA 2: Telemetría (Odómetro)

* Extrae el kilometraje exacto. Si el tablero es analógico, fíjate en la alineación de los números para detectar posibles manipulaciones.

- CAPA 3: Valoración de Estado (vehicleState)

* Asigna un entero del 0 al 5.

* Lógica de Audio: - Si ${audios.length === 0}: motor, embrage y caja DEBEN ser 0.

* Si hay audio: Analiza ruidos metálicos o irregularidades para calificar.

* Rating 0: Úsalo si la parte no es visible o si no hay audio para los componentes mecánicos.

- CAPA 4: Checklist de Componentes (vehicleComponents)

* State 0: No tiene/No detectado.

* State 1: Tiene y está OK.

* State 2: Tiene pero dañado o dudoso.

- CAPA 5: Resumen Ejecutivo y Valoración (Grounding)

* Nota de Peritaje (Campo notes): Elabora una narrativa profesional en menos de 200 palabras en español y detallada que resuma el estado general. Debe incluir:

* Qué ves a niveles generales (estética vs mecánica visual).

* Opinión experta sobre el cuidado que ha recibido el auto (mantenimiento aparente).

* Conclusión sobre si es una unidad recomendada o si requiere inversión inmediata.

* Busca el valor actual en portales líderes (ej. Mercado Libre) según el país. Ajusta el totalValue según el estado general y kilometraje.

ESTRUCTURA DE RESPUESTA (JSON ESTRICTO):

Devuelve EXCLUSIVAMENTE el JSON. Sin explicaciones adicionales.

{
"metadata": {
"mileage": 0,
"location": "Nombre de Sucursal o null",
"notes": nota resumen generada
},
"vehicle": {
"brand": "Marca",
"model": "Modelo",
"plate": "Matrícula",
"vin": "Nro. de Chasis",
"year": "Año"
},
"totalValue": 0,
"vehicleState": [
{ "name": "pintura", "rating": 0 },
{ "name": "chapa", "rating": 0 },
{ "name": "cubiertas", "rating": 0 },
{ "name": "parabrisas", "rating": 0 },
{ "name": "tapizado", "rating": 0 },
{ "name": "motor", "rating": 0 },
{ "name": "embrage", "rating": 0 },
{ "name": "caja", "rating": 0 },
{ "name": "trenDelantero", "rating": 0 },
{ "name": "trenTrasero", "rating": 0 },
{ "name": "amortiguadores", "rating": 0 },
{ "name": "frenos", "rating": 0 },
{ "name": "frenoMano", "rating": 0 },
{ "name": "lucesTablero", "rating": 0 },
{ "name": "bateria", "rating": 0 }
],
"vehicleComponents": [
{ "name": "aa", "state": 0 },
{ "name": "da", "state": 0 },
{ "name": "airbags", "state": 0 },
{ "name": "radio", "state": 0 },
{ "name": "vidriosElectricos", "state": 0 },
{ "name": "techoPanoramico", "state": 0 },
{ "name": "alfombras", "state": 0 },
{ "name": "alarma", "state": 0 },
{ "name": "bloqueo", "state": 0 },
{ "name": "llave1", "state": 0 },
{ "name": "llave2", "state": 0 },
{ "name": "control1", "state": 0 },
{ "name": "control2", "state": 0 },
{ "name": "llantas", "state": 0 },
{ "name": "tazas", "state": 0 },
{ "name": "estribos", "state": 0 },
{ "name": "barraAntiVuelco", "state": 0 },
{ "name": "barrasTecho", "state": 0 },
{ "name": "defensa", "state": 0 },
{ "name": "enganche", "state": 0 },
{ "name": "traccion4x4", "state": 0 },
{ "name": "lonaMaritima", "state": 0 },
{ "name": "cubreCaja", "state": 0 },
{ "name": "auxiliar", "state": 0 },
{ "name": "llave", "state": 0 },
{ "name": "gato", "state": 0 },
{ "name": "computest", "state": 0 }
],
"photos": [
{ "url": "URL_ORIGINAL", "alt": "Descripción técnica en español" }
]
}
`;

    // Preparar el array de partes para Gemini (Prompt + Archivos)
    const geminiParts = [{ text: systemPrompt }];

    // Procesar Fotos
    for (const file of photos) {
      const mimeType = file.mimetype;
      const fileData = fs.readFileSync(file.path);
      geminiParts.push({
        inlineData: {
          data: fileData.toString("base64"),
          mimeType,
        },
      });
    }

    // Procesar Audio (si existe)
    if (audios.length > 0) {
      const audioFile = audios[0];
      const audioData = fs.readFileSync(audioFile.path);
      geminiParts.push({
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: audioFile.mimetype,
        },
      });
    }

    // Realizar llamada a Gemini con backoff
    const result = await callGeminiWithRetry(model, geminiParts);
    let resultText = result.response.text();

    // Limpieza de Respuesta (Remover markdown json)
    if (resultText.includes("\`\`\`json")) {
      resultText = resultText.replace(/\`\`\`json\n|\n\`\`\`/g, "");
    } else if (resultText.includes("\`\`\`")) {
      resultText = resultText.replace(/\`\`\`\n|\n\`\`\`/g, "");
    }

    let structuredData;
    try {
      structuredData = JSON.parse(resultText.trim());
    } catch (parseError) {
      // Intentar extraer JSON via Regex como fallback
      const match = resultText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          structuredData = JSON.parse(match[0]);
        } catch (e) {
          throw new Error(
            "La IA no devolvió un JSON válido. Respuesta: " + resultText,
          );
        }
      } else {
        throw new Error(
          "La IA no devolvió un JSON parseable. Respuesta: " + resultText,
        );
      }
    }

    // Guardar las imágenes procesadas en public/images/ como hace la creación de peritaje
    const uploadDir = path.join(__dirname, "..", "public", "images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let baseUrl = `${req.protocol}://${req.get("host")}`;
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:3000";
    }

    const uploadPromises = photos.map(async (file, index) => {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const outputPath = path.join(uploadDir, filename);

      await sharp(file.path)
        .resize({ width: 1024, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Usar el alt descriptivo generado por la IA si existe
      const aiAlt =
        structuredData.photos &&
        structuredData.photos[index] &&
        structuredData.photos[index].alt
          ? structuredData.photos[index].alt
          : `Foto ${index + 1}`;

      return {
        url: `${baseUrl}/images/${filename}`,
        alt: aiAlt,
      };
    });

    // Reemplazar el array vacío de fotos que mandó la IA por las URLs definitivas que persistiremos
    structuredData.photos = await Promise.all(uploadPromises);

    // Construir la respuesta final de la API
    const finalResponse = {
      success: true,
      data: {
        ...structuredData,
        inspectionType: "INSPECTION",
        businessId: businessId,
        entityId: entityId || null,
      },
    };

    // Limpiar temporales
    if (req.files) {
      if (req.files.photos)
        req.files.photos.forEach(
          (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
        );
      if (req.files.audio)
        req.files.audio.forEach(
          (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
        );
    }

    return res.status(200).json(finalResponse);
  } catch (error) {
    // Limpiar temporales en caso de fallo crítico
    if (req.files) {
      if (req.files.photos)
        req.files.photos.forEach(
          (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
        );
      if (req.files.audio)
        req.files.audio.forEach(
          (f) => fs.existsSync(f.path) && fs.unlinkSync(f.path),
        );
    }

    console.error("Error en analyzePhotosController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al analizar las fotos con IA",
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
  getInspectionsByFilterController,
  getReinspectionsByFilterController,
  updateReinspectionStateController,
  analyzePhotosController,
};
