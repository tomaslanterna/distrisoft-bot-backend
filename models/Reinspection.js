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
  { _id: false },
);

/**
 * Esquema para los estados de partes individuales (Estrellas)
 */
const VehicleStateSchema = new Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
  },
  { _id: false },
);

/**
 * Esquema para los componentes presentes/ausentes (Checklist)
 */
const VehicleComponentSchema = new Schema(
  {
    name: { type: String, required: true },
    state: { type: Number, required: true, enum: [0, 1, 2], default: 0 },
  },
  { _id: false },
);

/**
 * MODELO: INSPECTION
 * Almacena el historial detallado de cada peritaje realizado.
 */
const ReInspectionSchema = new Schema(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: "Inspection",
      required: true,
    },
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
        "RE_INSPECTION",
        "REJECTED_REINSPECTION",
        "SUCCESSFULLY_REINSPECTION",
      ],
      required: true,
    },
    metadata: {
      mileage: { type: Number, required: true },
      location: String,
      externalTemp: String,
      notes: String,
    },
    checklistRating: { type: Number, default: 0 },
    overallRating: { type: Number, default: 0 },
    vehicleState: [VehicleStateSchema],
    vehicleComponents: [VehicleComponentSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { updatedAt: false } },
); // Las inspecciones suelen ser inmutables

// Índice para búsqueda rápida por vehículo (orden descendente para ver la última primero)
ReInspectionSchema.index({ vehicleId: 1, createdAt: -1 });

const Reinspection = mongoose.model("Reinspection", ReInspectionSchema);

module.exports = { Reinspection };
