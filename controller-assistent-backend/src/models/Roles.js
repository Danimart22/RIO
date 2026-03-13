    import { Schema, model } from "mongoose";

    export const ROLES = ["admin", "porteria", "RRHH", "empleado", "director", "gerente", "TI"]

    const roleSchema = new Schema({
        nombre: String
    }, {
        versionKey: false,
    });

    export default model("Roles", roleSchema);