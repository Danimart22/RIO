import { Schema, model } from "mongoose";

const visitanteSchema = new Schema({
  
  tipo_documento: {
    type: String,
    enum: ["CC", "CE", "PP", "TI"],
    required: true,
  },
  
  documento: {
    type: Number,
    required: true,
    unique: true
  },
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  sangre: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    required: true
  },
  telefono: {
    type: Number,
    required: true
  },
 

  direccion: {
    type: Schema.Types.Mixed,
    required: true
  },

  eps: {
    type: String,
    required: true
  },

  arl: {
    type: String,
    required: true
  },


  enfermedades: [{
    type: String,
    default: [],
  }],

  alergias:  [{
    type: String,
    default: [],
  }],

  fechas_reserva: [
    {
      oficina: {
        type: Schema.Types.ObjectId,
        ref: "Oficina",
  
      },
      fechaReserva: {
        type: Date,
  
      },
      responsable_mobilize: {
        type: String,
        required: true
      },
    
      motivo: {
        type: String
      },
      
      acudiente: {
        type: String,
        required: true
      },
      
      tipo_acudiente: {
        type: String,
        required: true
      },
      
      numero_acudiente: {
        type: String,
        required: true
      },
    },
  ],
}, {
  timestamps: true,
  versionKey: false
});



export default model("Visitante", visitanteSchema);