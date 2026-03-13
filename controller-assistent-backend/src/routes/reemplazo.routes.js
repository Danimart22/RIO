import { Router } from 'express';
const router = Router();

import * as reemplazoCtrl from '../controllers/reemplazo.controller.js';
import { authJwt, verifySignup } from '../middlewares/index.js';

// Ruta para crear un reemplazo
router.post("/",[authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.createReemplazo);

router.post("/asignarReemplazo",[authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.asignarReemplazo)

router.get("/:userId/:fecha", [authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.getReemplazoByFecha)

router.get("/", [authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.getReemplazo)

router.delete("/:userId/:reemplazoId", [authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.eliminarAsignacionReemplazo);

router.delete("/:reemplazoId", [authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], reemplazoCtrl.deleteReemplazo);


export default router;
