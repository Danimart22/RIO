import Roles from '../models/Roles.js'

export const createRole =  async () => {

    try {
        const count = await Roles.estimatedDocumentCount();

        if(count > 0) return;
    
        const values = await Promise.all([
            new Roles({ nombre: "admin" }).save(),
            new Roles({ nombre: "empleado" }).save(),
            new Roles({ nombre: "porteria"}).save(),
            new Roles({ nombre: "RRHH" }).save(),
            new Roles({ nombre: "director" }).save(),
            new Roles({ nombre: "gerente" }).save(),
            new Roles({ nombre: "TI" }).save(),
        ]);    

        console.log(values);
    } catch (error) {
        console.error(error);
    }
}
