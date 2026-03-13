import { Router } from "express";
const router = Router()

import * as visitanteCtrl from "../controllers/visitante.controller.js";
import {authJwt} from '../middlewares/index.js'

router.post('/', [authJwt.verifyToken, authJwt.userEmpleado], visitanteCtrl.createVisitante);

router.get('/', [authJwt.verifyToken, authJwt.userEmpleado], visitanteCtrl.getVisitantes)

router.get('/:visitanteId', [authJwt.verifyToken, authJwt.userRRHH], visitanteCtrl.getVisitantesById)

router.put('/:visitanteId', [authJwt.verifyToken , authJwt.userRRHH], visitanteCtrl.updateVisitanteById)

router.delete('/:visitanteId', [authJwt.verifyToken, authJwt.userRRHH], visitanteCtrl.deleteVisitanteById);

// Reserva de visitantes.//

router.post('/:visitanteId', [authJwt.verifyToken, authJwt.userEmpleado], visitanteCtrl.createReservaVisitante)

router.put('/:visitanteId/:fechaReserva', [authJwt.verifyToken, authJwt.userPorteria], visitanteCtrl.updateReservaVisitante )

router.delete('/borrar/:visitanteId/:fechaReserva', [authJwt.verifyToken, authJwt.userPorteria], visitanteCtrl.deleteReservaVisitanteByVisitanteId)

router.delete('/:userId/:fechaReserva', [authJwt.verifyToken, authJwt.userPorteria], visitanteCtrl.deleteReservaVisitanteByUserId)




export default router;