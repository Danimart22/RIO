import { Schema, model } from "mongoose";

const oficinaSchema = new Schema({
  fecha: {
    type: Date,
    required: true,
    unique: true,
  },
  asientosDisponibles: {
    type: Number,
    required: true,
    default: 80,
    min: 0,
  },
  reservas: [
    {
      usuario: {
        type: Schema.Types.ObjectId,
        ref: "User", // Referencia al modelo "User"
        required: true,
      },
      documento:{
        type: String,
        ref: "User",
      },
      fechaReserva: {
        type: Date,
        required: true,
      },
      horaLlegada: {
        type: [String],
      },
      horaSalida: {
        type: [String],
      },
      numeroSilla: {
        type: Number, // Agregar un campo para el número de silla
      },
      tipo: {
      type: String,
      enum: ["usuario", "visitante"],
      required: true,
    },
    },
  ],
  reservasVisitante: [
    {
      usuario: {
        type: Schema.Types.ObjectId,
        ref: "Visitante", // Referencia al modelo "Visitante"
        required: true,
      },
      fechaReserva: {
        type: Date,
        required: true,
      },
    },
  ],
  reservasReemplazo: [
    {
      usuario: {
        type: Schema.Types.ObjectId,
        ref: "User", // Referencia al modelo "User"
        required: true,
      },
      reemplazo: {
        type: Schema.Types.ObjectId,
        ref: "Reemplazo", // Referencia al modelo "Reemplazo" para el usuario de reemplazo
      },
      fechaReserva: {
        type: Date,
        required: true,
      },
    },
  ],
});

export default model("Oficina", oficinaSchema);
