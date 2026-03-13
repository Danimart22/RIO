import { ROLES } from '../models/Roles.js';
import pool from '../database.js'; // tu conexión a PostgreSQL

// Middleware para verificar usuarios duplicados
export const checkDuplicateUser = async (req, res, next) => {
  try {
    const { documento, correo } = req.body;

    // Verificar si existe usuario ACTIVO con el mismo documento
    const docResult = await pool.query(
      `SELECT 1 FROM users WHERE documento = $1 AND LOWER(TRIM(estado)) = 'activo'`,
      [documento]
    );
    if (docResult.rows.length > 0) {
      return res.status(400).json({ 
        message: "Ya hay un usuario activo con ese documento de identidad" 
      });
    }

    // Verificar si existe usuario ACTIVO con el mismo correo
    const correoResult = await pool.query(
      `SELECT 1 FROM users WHERE correo = $1 AND LOWER(TRIM(estado)) = 'activo'`,
      [correo]
    );
    if (correoResult.rows.length > 0) {
      return res.status(400).json({ 
        message: "Ya hay un usuario activo con ese correo registrado" 
      });
    }

    // Si llegamos aquí, o no existe el usuario, o existe pero está inactivo
    // En ambos casos, permitimos continuar al controller
    next();
  } catch (error) {
    console.error('Error en checkDuplicateUser:', error);
    return res.status(500).json({ 
      message: "Error verificando usuario duplicado" 
    });
  }
};

// Middleware para verificar roles válidos
export const checkRolesExisted = (req, res, next) => {
  try {
    if (req.body.roles) {
      for (let i = 0; i < req.body.roles.length; i++) {
        if (!ROLES.includes(req.body.roles[i])) {
          return res.status(400).json({
            message: `El rol ${req.body.roles[i]} no existe`
          });
        }
      }
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error verificando roles" });
  }
};
