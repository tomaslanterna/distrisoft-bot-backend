const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Esquema para las fotos con metadatos de accesibilidad
 */
const PhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true }, // Descripción de la imagen (ej: "Frente del vehículo", "Detalle motor")
  },
  { _id: false }
);

/**
 * Esquema para los estados de partes individuales (Estrellas)
 */
const VehicleStateSchema = new Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
  },
  { _id: false }
);

/**
 * Esquema para los componentes presentes/ausentes (Checklist)
 */
const VehicleComponentSchema = new Schema(
  {
    name: { type: String, required: true },
    state: { type: Number, required: true, enum: [0, 1, 2], default: 0 },
  },
  { _id: false }
);

/**
 * MODELO: INSPECTION
 * Almacena el historial detallado de cada peritaje realizado.
 */
const InspectionSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    inspectorId: { type: Schema.Types.ObjectId, required: true },
    inspectionType: {
      type: String,
      enum: [
        "INSPECTION",
        "RE_INSPECTION",
        "REJECTED_INSPECTION",
        "SUCCESSFULLY_INSPECTION",
      ],
      required: true,
    },
    metadata: {
      mileage: { type: Number, required: true },
      location: String,
      externalTemp: String,
      notes: String,
    },
    vehicleState: [VehicleStateSchema],
    vehicleComponents: [VehicleComponentSchema],
    photos: [PhotoSchema], // Ahora usa el esquema con URL y Alt
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { updatedAt: false } }
); // Las inspecciones suelen ser inmutables

// Índice para búsqueda rápida por vehículo (orden descendente para ver la última primero)
InspectionSchema.index({ vehicleId: 1, createdAt: -1 });

const Inspection = mongoose.model("Inspection", InspectionSchema);

module.exports = { Inspection };
