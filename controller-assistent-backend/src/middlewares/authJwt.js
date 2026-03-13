import jwt from "jsonwebtoken";
import { SECRET } from "../config.js";
import pool from "../database.js"; // tu conexión a PostgreSQL

// Verificar token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) {
      return res.status(403).json({ message: "No se ha otorgado token" });
    }

    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;

    const userResult = await pool.query(
      `SELECT id, brigadista FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "No se encontró usuario" });
    }

    req.user = userResult.rows[0]; // Guardamos info básica del usuario
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "No cuentas con autorizacion para esta acción" });
  }
};

// Función genérica para verificar roles
const checkUserRole = async (req, res, next, roleName) => {
  try {
    const rolesResult = await pool.query(
      `SELECT r.nombre 
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [req.userId]
    );

    const roles = rolesResult.rows.map(r => r.nombre);

    if (roles.includes(roleName)) {
      next();
    } else {
      return res.status(403).json({
        message: `Se requiere ser de ${roleName} para realizar esta accion`
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error });
  }
};

// Middlewares específicos de roles
export const userAdmin = (req, res, next) => checkUserRole(req, res, next, "admin");
export const userEmpleado = (req, res, next) => checkUserRole(req, res, next, "empleado");
export const userRRHH = (req, res, next) => checkUserRole(req, res, next, "RRHH");
export const userPorteria = (req, res, next) => checkUserRole(req, res, next, "porteria");
export const userTI = (req, res, next) => checkUserRole(req, res, next, "TI");

// Middleware Brigadista
export const userBrigadista = async (req, res, next) => {
  try {
    if (req.user.brigadista === "Si") {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Se requiere ser de Brigadista para realizar esta accion" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error });
  }
};

// Middleware TI o RRHH
export const userReportado = async (req, res, next) => {
  try {
    const rolesResult = await pool.query(
      `SELECT r.nombre 
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [req.userId]
    );

    const roles = rolesResult.rows.map(r => r.nombre);

    if (roles.includes("TI") || roles.includes("RRHH")) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Se requiere ser de TI o RRHH para realizar esta accion" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error });
  }
};
export const userPorteriaOrRRHH = async (req, res, next) => {
  try {
    const rolesResult = await pool.query(
      `SELECT r.nombre 
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [req.userId]
    );

    const roles = rolesResult.rows.map(r => r.nombre);

    if (roles.includes("porteria") || roles.includes("RRHH")) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Se requiere ser de Portería o RRHH para realizar esta accion" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error });
  }
}