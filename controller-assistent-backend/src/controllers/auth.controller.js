import pool from "../database.js";
import jwt from "jsonwebtoken";
import { SECRET } from "../config.js";
import bcrypt from "bcryptjs";
import { logger } from "../logger/logger.js";
// Función auxiliar para encriptar contraseña
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Función auxiliar para comparar contraseña
const comparePassword = async (password, receivedPassword) => {
  return await bcrypt.compare(password, receivedPassword);
};

// Función para generar username automático
function generateUsername(firstName, lastName) {
  const firstNameLower = firstName.toLowerCase().split(" ")[0];
  const lastNameLower = lastName.toLowerCase().split(" ")[0];
  return `${firstNameLower}_${lastNameLower}`;
}

// Registro de usuario (signUp)
export const signUp = async (req, res) => {
  const client = await pool.connect();
  logger.info(
    {
      ip: req.ip,
      correo: req.body?.correo,
      documento: req.body?.documento,
    },
    "Inicio de registro de usuario"
  );

  try {
    const {
      username,
      documento,
      tipo_documento,
      nombres,
      apellidos,
      correo,
      sangre,
      cargo,
      area,
      subarea,
      empresa,
      telefono,
      acudiente,
      tipo_acudiente,
      numero_acudiente,
      direccion,
      eps,
      arl,
      password,
      enfermedades,
      alergias,
      brigadista,
      roles,
    } = req.body;

    await client.query('BEGIN');
    logger.debug("Transacción iniciada (signUp)");
    // Primero buscar usuario inactivo
    const inactiveUserQuery = `
      SELECT *
      FROM users
      WHERE (documento = $1 OR correo = $2)
        AND LOWER(TRIM(estado)) = 'inactivo'
      LIMIT 1
    `;
    const inactiveUserResult = await client.query(inactiveUserQuery, [
      documento,
      correo,
    ]);


    // Si existe un usuario inactivo, reactivarlo
    if (inactiveUserResult.rows.length > 0) {
      const existingUser = inactiveUserResult.rows[0];
      logger.info(
        { userId: existingUser.id },
        "Usuario inactivo encontrado, reactivando"
      );

      await client.query(
        `
        UPDATE users
        SET estado = 'activo',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [existingUser.id]
      );

      if (roles && roles.length > 0) {
        logger.debug(
          { userId: existingUser.id, roles },
          "Reasignando roles a usuario reactivado"
        );
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [existingUser.id]);
        const rolesQuery = `SELECT id FROM roles WHERE nombre = ANY($1)`;
        const rolesResult = await client.query(rolesQuery, [roles]);

        for (const role of rolesResult.rows) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [existingUser.id, role.id]
          );
        }
      }

      await client.query('COMMIT');
      logger.info(
        { userId: existingUser.id },
        "Usuario reactivado exitosamente"
      );
      const token = jwt.sign({ id: existingUser.id }, SECRET, {
        expiresIn: 86400,
      });

      return res.status(200).json({
        message: "Usuario reactivado exitosamente.",
        token
      });
    }
    const activeUserQuery = `
      SELECT *
      FROM users
      WHERE (documento = $1 OR correo = $2)
        AND LOWER(TRIM(estado)) = 'activo'
      LIMIT 1
    `;
    const activeUserResult = await client.query(activeUserQuery, [
      documento,
      correo,
    ]);
    if (activeUserResult.rows.length > 0) {
      logger.warn(
        {
          correo,
          documento,
          userId: activeUserResult.rows[0].id,
        },
        "Intento de registro con usuario activo existente"
      );
      const activeUser = activeUserResult.rows[0];
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Ya existe un usuario activo con ese documento o correo.",
      });
    }
    const plainPassword = password || documento.toString();
    const hashedPassword = await encryptPassword(plainPassword);

    // Normalizar arrays
    const normalizarArray = (dato) => {
      if (!dato) return [];
      if (Array.isArray(dato)) return dato.filter(v => v && v.trim() !== '');
      if (typeof dato === 'string') {
        try {
          const parsed = JSON.parse(dato);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return dato.split(',').map(v => v.trim()).filter(v => v !== '');
        }
      }
      if (typeof dato === 'object') return Object.keys(dato).filter(k => dato[k]);
      return [];
    };

    const enfermedadesArray = normalizarArray(enfermedades);
    const alergiasArray = normalizarArray(alergias);

    const insertUserQuery = `
      INSERT INTO users (
        username, tipo_documento, documento, nombres, apellidos, correo, cargo, area, subarea, empresa,
        sangre, telefono, acudiente, tipo_acudiente, numero_acudiente,
        direccion, eps, arl, password,
        enfermedades, alergias, estado, brigadista, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21, 'activo',$22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const userResult = await client.query(insertUserQuery, [
      username,
      tipo_documento,
      documento,
      nombres,
      apellidos,
      correo,
      cargo,
      area,
      subarea,
      empresa,
      sangre,
      telefono,
      acudiente,
      tipo_acudiente,
      numero_acudiente,
      direccion,
      eps,
      arl,
      hashedPassword,
      JSON.stringify(enfermedadesArray),
      JSON.stringify(alergiasArray),
      brigadista || "No",
    ]);

    const newUser = userResult.rows[0];
    if (roles && roles.length > 0) {
      const rolesQuery = `SELECT id FROM roles WHERE nombre = ANY($1)`;
      const rolesResult = await client.query(rolesQuery, [roles]);

      for (const role of rolesResult.rows) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [newUser.id, role.id]
        );
      }
    } else {
      const roleQuery = `SELECT id FROM roles WHERE nombre = 'empleado'`;
      const roleResult = await client.query(roleQuery);

      if (roleResult.rows.length > 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [newUser.id, roleResult.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    const token = jwt.sign({ id: newUser.id }, SECRET, {
      expiresIn: 86400,
    });
    logger.info(
      {
        userId: newUser.id,
        correo: newUser.correo,
      },
      "Usuario creado exitosamente"
    );
    return res.status(200).json({ token });


  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(
      {
        err: error,
        stack: error.stack,
        correo: req.body?.correo,
      },
      "Error en signUp"
    );

    console.error('Error en signUp:', error);
    return res.status(500).json({
      message: "Error al crear el usuario.",
      error: error.message
    });
  } finally {
    client.release();
    logger.debug("Conexión liberada (signUp)");
  }
};
// Registro masivo de usuarios (signUpImport)
export const signUpImport = async (req, res) => {
  const client = await pool.connect();
  logger.info(
    { totalUsers: Array.isArray(req.body) ? req.body.length : 0 },
    "Inicio de registro masivo de usuarios"
  );

  try {
    const usersData = req.body;

    // Validar que se proporcionó una lista de usuarios
    if (!Array.isArray(usersData)) {
      return res
        .status(400)
        .json({ message: "La solicitud debe contener una lista de usuarios." });
    }

    const savedUsers = [];
    const errorUsers = [];

    for (const userData of usersData) {
      try {
        await client.query('BEGIN');

        // Verificar si existe usuario con el mismo correo
        const existingCorreoQuery = `SELECT * FROM users WHERE correo = $1`;
        const existingCorreoResult = await client.query(existingCorreoQuery, [userData.correo]);

        if (existingCorreoResult.rows.length > 0) {
          errorUsers.push({
            message: `Ya existe otro usuario con el correo: ${userData.correo}`,
          });
          logger.warn(
            { correo: userData.correo },
            "Usuario omitido por correo duplicado"
          );
          await client.query('ROLLBACK');
          continue;
        }

        // Verificar si existe usuario con el mismo documento
        const existingDocQuery = `SELECT * FROM users WHERE documento = $1`;
        const existingDocResult = await client.query(existingDocQuery, [userData.documento]);

        if (existingDocResult.rows.length > 0) {
          errorUsers.push({
            message: `Ya existe otro usuario con el documento: ${userData.documento}`,
          });
          logger.warn(
            { documento: userData.documento },
            "Usuario omitido por documento duplicado"
          );
          await client.query('ROLLBACK');
          continue;
        }

        const {
          nombres,
          apellidos,
          username,
          tipo_documento,
          documento,
          correo,
          sangre,
          telefono,
          acudiente,
          tipo_acudiente,
          numero_acudiente,
          direccion,
          eps,
          arl,
          password,
          enfermedades,
          alergias,
          estado,
          brigadista,
          roles,
        } = userData;

        // Generar contraseña encriptada
        const encryptedPassword = password || (documento ? documento.toString() : "");
        const hashedPassword = await encryptPassword(encryptedPassword);

        // Generar username si no existe
        const generatedUsername = username || generateUsername(nombres, apellidos);

        // Insertar usuario
        const insertUserQuery = `
          INSERT INTO users (
            username, tipo_documento, documento, nombres, apellidos, correo,
            sangre, telefono, acudiente, tipo_acudiente, numero_acudiente,
            direccion, eps, arl, password, enfermedades, alergias, estado, brigadista
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *
        `;

        const userResult = await client.query(insertUserQuery, [
          generatedUsername,
          tipo_documento,
          documento,
          nombres,
          apellidos,
          correo,
          sangre,
          telefono,
          acudiente,
          tipo_acudiente,
          numero_acudiente,
          direccion,
          eps,
          arl,
          hashedPassword,
          enfermedades,
          alergias,
          estado || "activo",
          brigadista || "No",
        ]);

        const savedUser = userResult.rows[0];

        // Asignar roles
        if (roles && roles.length > 0) {
          const rolesQuery = `SELECT id FROM roles WHERE nombre = ANY($1)`;
          const rolesResult = await client.query(rolesQuery, [roles]);

          for (const role of rolesResult.rows) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [savedUser.id, role.id]
            );
          }
        } else {
          // Asignar rol "empleado" por defecto
          const roleQuery = `SELECT id FROM roles WHERE nombre = 'empleado'`;
          const roleResult = await client.query(roleQuery);

          if (roleResult.rows.length > 0) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [savedUser.id, roleResult.rows[0].id]
            );
          }
        }

        await client.query('COMMIT');
        savedUsers.push(savedUser);
        logger.info(
          { userId: savedUser.id, correo: savedUser.correo },
          "Usuario importado exitosamente"
        );

      } catch (error) {
        await client.query('ROLLBACK');
        errorUsers.push({
          message: `Error al procesar usuario con documento ${userData.documento}: ${error.message}`,
        });
        logger.error(
          {
            err: error,
            documento: userData.documento,
          },
          "Error al importar usuario"
        );
      }
    }

    res.status(200).json({ users: savedUsers, errorUsers });
    logger.info(
      {
        success: savedUsers.length,
        failed: errorUsers.length,
      },
      "Finalizó el registro masivo"
    );

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear los usuarios." });
  } finally {
    client.release();
  }
};

// Inicio de sesión (signin)
export const signin = async (req, res) => {
  logger.info(
    "Intento de inicio de sesión"
  );
  try {
    const { correo, password } = req.body;

    // Buscar usuario por correo con sus roles
    const userQuery = `
      SELECT 
        u.*,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'nombre', r.nombre)
          ) FILTER (WHERE r.nombre IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.correo = $1
      GROUP BY u.id
    `;

    const userResult = await pool.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      logger.warn(
        { correo },
        "Intento de login con correo inexistente"
      );
      return res.status(400).json({ message: "No se encontró correo asociado" });

    }

    const userFound = userResult.rows[0];

    // Verificar si el usuario está activo
    if (userFound.estado !== "activo") {
      logger.warn(
        { userId: userFound.id },
        "Intento de login con usuario inactivo"
      );
      return res.status(401).json({
        token: null,
        message: "Usuario inactivo. Pide a un administrador que reactive tu cuenta",
      });
    }

    // Comparar contraseña
    const matchPassword = await comparePassword(password, userFound.password);

    if (!matchPassword) {
      logger.warn(
        { userId: userFound.id },
        "Contraseña incorrecta"
      );
      return res.status(401).json({
        token: null,
        message: "Contraseña incorrecta, la contraseña que se ingresó es incorrecta",
      });
    }

    // Generar token JWT con expiración de 1 hora
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1);

    const token = jwt.sign(
      { id: userFound.id, expiry: tokenExpiration },
      SECRET,
      { expiresIn: "1h" }
    );

    // Extraer nombres de roles
    const roleNames = userFound.roles.map((role) => role.nombre);
    logger.info(
      {
        userId: userFound.id,
        roles: userFound.roles.map(r => r.nombre),
      },
      "Inicio de sesión exitoso"
    );

    res.json({
      token,
      role: roleNames,
      id: userFound.id,
      username: userFound.username,
      nombres: userFound.nombres,
      apellidos: userFound.apellidos,
      helpers: userFound.brigadista,
      seatPass: userFound.asiento,
      documento: userFound.documento,
    });

  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Error en signin"
    );
    console.error("Error en la autenticación:", error);
    return res.status(500).json({ message: "Error en la autenticación" });
  }
};