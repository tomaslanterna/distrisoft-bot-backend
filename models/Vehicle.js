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
 * MODELO: VEHICLE
 * Representa la unidad física y su estado actual en el flujo de negocio.
 */
const VehicleSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    plate: {
      type: String,
      required: true,
      unique: false,
      uppercase: true,
      trim: true,
    },
    vin: {
      type: String,
      required: false,
      unique: false,
      uppercase: true,
      sparse: true,
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING_REVIEW",
        "REJECTED_REVIEW",
        "SUCCESSFULLY_REVIEW",
        "IN_SERVICE",
        "SUCCESSFULLY_SELLED",
      ],
      default: "PENDING_REVIEW",
    },
    rating: { type: Number, default: 0 },
    currentInspectionId: { type: Schema.Types.ObjectId, ref: "Inspection" },
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true },
);

// Índice compuesto para multitenancy eficiente
VehicleSchema.index({ businessId: 1, plate: 1 });

const Vehicle = mongoose.model("Vehicle", VehicleSchema);

module.exports = { Vehicle };
