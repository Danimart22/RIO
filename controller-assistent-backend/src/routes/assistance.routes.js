import { Router } from "express";
const router = Router()

import * as oficinaCtrl from '../controllers/oficina.controller.js';
import { authJwt } from '../middlewares/index.js';

// Obtener todas las reservas
router.get('/reserva', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservas);

// Obtener reserva por usuario
router.get('/reserva/:usuarioId', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.getReservasByUsuario);

router.get('/reserva/:visitanteId', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.getReservasByVisitante);

// Obtener reserva por usuario
router.get('/asistencia/:usuarioId', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.getAsistenciasByUsuario);

// se obtiene las sillas reservadas por fechas
router.get('/sillasReservadas/:fecha', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.getSillasReservadas);

// Obtener reservas por fechas
router.get('/reservas/:fecha', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservasByFecha);

// Crear una reserva en la oficina
router.post('/reserva/:usuarioId', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.createReserva);

router.post('/updatereserva/:usuarioId', [authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.updateReserva);

router.get('/reservasRango', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservasPorRangoDeFechas);

router.get('/reservasPuesto',[authJwt.verifyToken, authJwt.userRRHH],oficinaCtrl.getReservasPorPuestos);

router.get('/reservasVisitantes/:fecha', [authJwt.verifyToken, authJwt.userPorteria], oficinaCtrl.getReservasVisitanteByFecha);

router.get('/reservasVisitanteRango', [authJwt.verifyToken, authJwt.userPorteria], oficinaCtrl.getReservasVisitantePorRangoDeFechas);

// Eliminar una reserva en la oficina
router.delete("/reserva/:userId/:fechaReserva",[authJwt.verifyToken, authJwt.userEmpleado], oficinaCtrl.deleteReserva);

router.get('/reservasPorteria/:fecha', [authJwt.verifyToken, authJwt.userPorteriaOrRRHH], oficinaCtrl.getReservasByFecha);


router.get('/reservasBrigadista/:fecha', [authJwt.verifyToken, authJwt.userBrigadista], oficinaCtrl.getReservasByFecha);

router.post('/reservaMasiva', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.reservaMasiva)

const blockIfDisabled = (req, res, next) => {
  if (process.env.IMPORT_RESERVA_ENABLED !== 'true') {
    return res.status(403).json({ message: 'Ruta deshabilitada' });
  }
  next();
};

router.post('/importReserva', [blockIfDisabled], oficinaCtrl.importReserva);

router.get('/reservasTardes', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservasTardesByRangoFechas);

router.get('/reservasAusencias', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservasNoAsistieronByRangoFechas);

router.get('/reservasCumplidas', [authJwt.verifyToken, authJwt.userRRHH], oficinaCtrl.getReservasLlegaronATiempoByRangoFechas);
export default router;

