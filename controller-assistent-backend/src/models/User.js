import { Schema, model } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },

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

    correo: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          // Utilizamos una expresión regular para validar la dirección de correo electrónico
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Ingrese una dirección de correo electrónico válida",
      },
    },

    sangre: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    telefono: {
      type: Number,
    },

    cargo: {
      type: String,
    },

    area: {
      type: String,
    },

    empresa: {
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

    brigadista: {
      type: String,
      enum: ["Si", "No"],
      default: "No",
    },

    password: {
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

    fechas_reserva: [
      {
        oficina: {
          type: Schema.Types.ObjectId,
          ref: "Oficina",
        },
        tipo: {
          type: String,
          enum: ["usuario", "visitante"],
        },
        fechaReserva: {
          type: Date,
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
      },
    ],

    roles: [
      {
        ref: "Roles", 
        type: Schema.Types.ObjectId,
        default: [],
      },
    ],

    randomNumbers: {
      type: [Number], // El campo randomNumbers será un array de números
    },

    asiento: {
      type: Number,
    },

    codeExpiration: {
      type: Date,
    },

    reportes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Observaciones",
      },
    ],
    // Nuevo campo para reemplazo
    reemplazos: [
      {
        reemplazoId: {
          type: Schema.Types.ObjectId,
          ref: "Reemplazo",
        },
        nombre: {
          type: String,
        },
        rangoFechas: {
          desde: {
            type: Date,
          },
          hasta: {
            type: Date,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.statics.encryptPassword = async function (password) {
  if (!password) {
    throw new Error("Invalid password");
  }
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

userSchema.statics.comparePassword = async (password, receivedPassword) => {
  return await bcrypt.compare(password, receivedPassword);
};

export default model("User", userSchema);
