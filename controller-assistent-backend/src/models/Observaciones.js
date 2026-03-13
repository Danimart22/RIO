import { Schema, model } from "mongoose";

const observacionSchema = new Schema({
  fecha: {
    type: Date,
    required: true,
  },

  asientoReportado: {
    type: Number,
    required: true,
  },

  observaciones: {
    type: String,
  },

  objetos: {
    type: [Object],
    required: true,
    objeto:{
      type: String,
      enum: [
      "Pantalla",
      "Teclado",
      "Mouse",
      "Descansa pies",
      "Silla",
      "Hub adaptador USB",
      "Cable de video HDMI",
      "Otros",
    ],
  },

    estado: {
      type: String,
      enum: ["activo", "resuelto"],
      default: "activo",
    },
    tipo: {
      type:String,
      enum: ["faltante","dañado"]
    },
  },

  usuarioReportante: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "User", // Referencia al modelo User
        required: true,
      },

      nombreReportante: {
        type: String,
        ref: "User", // Referencia al modelo User
        required: true,
      },
    },
  ],
});

export default model("Observaciones", observacionSchema);
