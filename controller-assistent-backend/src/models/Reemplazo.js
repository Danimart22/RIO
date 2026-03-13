import { Schema, model } from "mongoose";
import mongoose from "mongoose";

// Definición del esquema de reemplazo
const reemplazoSchema = new mongoose.Schema(
  {
    tipo_documento: {
      type: String,
      enum: ["CC", "CE", "PP", "TI"],
      required: true,
    },
    documento: {
      type: Number,
      required: true,
    },
    nombres: {
      type: String,
      required: true,
    },
    apellidos: {
      type: String,
      required: true,
    },
    sangre: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+"],
    },
    telefono: {
      type: Number,
    },
    cargo: {
      type: String,
    },
    acudiente: {
      type: String,
    },
    tipo_acudiente: {
      type: String,
    },
    numero_acudiente: {
      type: String,
    },
    direccion: {
      type: Schema.Types.Mixed,
    },
    eps: {
      type: String,
    },
    arl: {
      type: String,
    },
    enfermedades: [
      {
        type: String,
        default: [],
      },
    ],
    alergias: [
      {
        type: String,
        default: [],
      },
    ],
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
    },
    // Fechas de reemplazo con los respectivos usuarios
    fechas_de_reemplazo: [
      {
        usuarioId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        desde: {
          type: Date,
          required: true,
        },
        hasta: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v de los documentos
  }
);

// Creación del modelo basado en el esquema
export default model("Reemplazo", reemplazoSchema);
