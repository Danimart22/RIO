import { Router } from 'express';
const router = Router();

import * as userCtrl from '../controllers/user.controller.js';
import { authJwt, verifySignup } from '../middlewares/index.js';

// Rutas para usuarios

// Crear un nuevo usuario
router.post('/', [authJwt.verifyToken, authJwt.userRRHH, verifySignup.checkRolesExisted], userCtrl.createUser);

// Obtener todos los usuarios activos
router.get('/', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.getUsers);

router.get('/responsables', [authJwt.verifyToken, authJwt.userEmpleado], userCtrl.getUsers);

// Obtener todos los usuarios (incluyendo inactivos)
router.get('/all', [authJwt.verifyToken, authJwt.userAdmin], userCtrl.getAllUsers);

// Traer los días de reserva de TODOS los usuarios
router.get('/all-users-days', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.getAllUsersDays);

// Obtener todos los usuarios activos cuyo rol es igual a EMPLEADOS
router.get('/visitantes', [authJwt.verifyToken, authJwt.userPorteria], userCtrl.getUsersEmpleados);

// Actualización masiva de usuarios
router.put('/massive-update', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.massiveUserUpdate);

// Asignar area a varios usuarios
router.put('/assignAreaUsers', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.assignAreaToUsers);

// Eliminar un usuario (solo lo deshabilita)
router.put('/delete/:userId', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.deleteUser);

// Restablecer contraseña autenticado
router.put('/restPassword/:id', [authJwt.verifyToken, authJwt.userEmpleado], userCtrl.updatePassword);

// Restablecimiento de contraseña (flujo olvidé mi contraseña - sin auth)
router.post('/sendNumbers', userCtrl.sendRandomNumbers);
router.post('/verifyCode', userCtrl.verifyCode);
router.post('/changePassword', userCtrl.changePassword);

// Asignar días de reserva por area o subarea
router.post('/assign-days-by-area', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.assignDaysByArea);

// Asignar días de reserva por usuario especifico
router.post('/assign-days-by-user', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.assignDaysByUserId);

// Traer los días de reserva por usuario
router.get('/:userId/dias', [authJwt.verifyToken, authJwt.userRRHH], userCtrl.getUserDays);

// Obtener un usuario por su ID
router.get('/:userId', [authJwt.verifyToken, authJwt.userEmpleado], userCtrl.getUserById);

// Actualizar un usuario
router.put('/:userId', [authJwt.verifyToken, authJwt.userEmpleado], userCtrl.updateUser);

export default router;