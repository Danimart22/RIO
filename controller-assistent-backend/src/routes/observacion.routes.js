import { Router } from "express";
const router = Router()

import * as obserCtrl from '../controllers/observacion.controller.js'
import { authJwt, verifySignup } from "../middlewares/index.js";

// Crear reporte de objetos perdidos
router.post('/',[authJwt.verifyToken, authJwt.userEmpleado], obserCtrl.createObservacion)

// Marcar como resulto un reporte
router.put('/:id/:obj',[authJwt.verifyToken, authJwt.userReportado], obserCtrl.resolverObservacion)

// Mirar todo los reportes
router.get('/all', [authJwt.verifyToken, authJwt.userReportado], obserCtrl.getAllReport)

//Mirar los reportes que estan sin resolver
router.get('/', [authJwt.verifyToken, authJwt.userEmpleado], obserCtrl.getObservacionesActivas)

//Consultar reportes por puesto
router.get('/:silla', [authJwt.verifyToken, authJwt.userEmpleado], obserCtrl.findBySeat)

//Consulta de reportes dentro de un rango de fechas
router.get('/rango/:fechaIni/:fechaFinal', [authJwt.verifyToken, authJwt.userReportado], obserCtrl.getObservacionesPorRango);

export default router;