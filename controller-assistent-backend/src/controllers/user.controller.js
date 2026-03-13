import pool from "../database.js";
import bcrypt from "bcryptjs";
import { sendMail } from "../libs/SESMailer.js";

// Función auxiliar para encriptar contraseña
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Crear usuario
export const createUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      username,
      documento,
      tipo_documento,
      nombres,
      apellidos,
      correo,
      area,
      cargo,
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
      roles,
    } = req.body;

    await client.query('BEGIN');

    // Verificar si ya existe un usuario con el mismo documento o correo
    const existingUserQuery = `
      SELECT * FROM users 
      WHERE documento = $1 OR correo = $2
    `;
    const existingUserResult = await client.query(existingUserQuery, [documento, correo]);

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      const estadoActual = (existingUser.estado || "").toLowerCase().trim();

      if (estadoActual === "inactivo") {
        // Reactivar usuario
        const updateQuery = `
          UPDATE users 
          SET estado = 'activo', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [existingUser.id]);

        // Obtener roles del usuario
        const rolesQuery = `
          SELECT r.nombre 
          FROM roles r
          INNER JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = $1
        `;
        const rolesResult = await client.query(rolesQuery, [existingUser.id]);

        await client.query('COMMIT');

        return res.status(200).json({
          id: existingUser.id,
          username: existingUser.username,
          correo: existingUser.correo,
          nombres: existingUser.nombres,
          apellidos: existingUser.apellidos,
          roles: rolesResult.rows.map(r => r.nombre),
          message: "Usuario reactivado exitosamente.",
        });
      }

      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Ya existe otro usuario con el mismo documento o correo.",
      });
    }
    // Encriptar contraseña
    const encryptedPassword = await encryptPassword(password);

    //NORMALIZAR ENFERMEDADES Y ALERGIAS
    const normalizarArray = (dato) => {
      if (!dato) return [];
      if (Array.isArray(dato)) return dato.filter(item => item && String(item).trim() !== '');
      if (typeof dato === 'string') {
        try {
          const parsed = JSON.parse(dato);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return dato.split(',').map(item => item.trim()).filter(item => item !== '');
        }
      }
      if (typeof dato === 'object') return Object.keys(dato).filter(key => dato[key]);
      return [];
    };

    const enfermedadesSafe = normalizarArray(enfermedades);
    const alergiasSafe = normalizarArray(alergias);
    const insertUserQuery = `
      INSERT INTO users (
        username, documento, tipo_documento, nombres, apellidos, correo,
        area, cargo, sangre, telefono, acudiente, tipo_acudiente,
        numero_acudiente, direccion, eps, arl, password, enfermedades,
        alergias, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const userResult = await client.query(insertUserQuery, [
      username,
      documento,
      tipo_documento,
      nombres,
      apellidos,
      correo,
      area ?? null,
      cargo ?? null,
      sangre ?? null,
      telefono ?? null,
      acudiente ?? null,
      tipo_acudiente ?? null,
      numero_acudiente ?? null,
      direccion ?? null,       // JSONB
      eps ?? null,
      arl ?? null,
      encryptedPassword,
      JSON.stringify(enfermedadesSafe ?? []),    // JSONB
      JSON.stringify(alergiasSafe ?? []),        // JSONB
      estado || 'activo'// JSONB
    ]);

    const newUser = userResult.rows[0];

    // Insertar roles si existen
    if (roles && roles.length > 0) {
      // Buscar IDs de roles
      const rolesQuery = `
        SELECT id FROM roles WHERE nombre = ANY($1)
      `;
      const rolesResult = await client.query(rolesQuery, [roles]);

      // Insertar en tabla intermedia
      for (const role of rolesResult.rows) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [newUser.id, role.id]
        );
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      id: newUser.id,
      username: newUser.username,
      correo: newUser.correo,
      nombres: newUser.nombres,
      apellidos: newUser.apellidos,
      roles: roles || [],
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al crear el usuario." });
  } finally {
    client.release();
  }
};
// Obtener usuarios activos
export const getUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        id as id, username, tipo_documento, documento, nombres, apellidos, correo,
        sangre, telefono, cargo, area, subarea, empresa, acudiente, tipo_acudiente,
        numero_acudiente, direccion, eps, arl, brigadista, password,
        estado, asiento, code_expiration, created_at, updated_at,
        enfermedades, alergias
      FROM users
      WHERE estado = 'activo'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los usuarios." });
  }
};

// -------------------- getUsersEmpleados --------------------
export const getUsersEmpleados = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT u.id, u.username, u.tipo_documento, u.documento, u.nombres, 
             u.apellidos, u.correo, u.sangre, u.telefono, u.cargo, u.area, u.empresa,
             u.acudiente, u.tipo_acudiente, u.numero_acudiente, u.direccion, 
             u.eps, u.arl, u.brigadista, u.password, u.estado, u.asiento, 
             u.code_expiration, u.created_at, u.updated_at,
             u.enfermedades, u.alergias
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.estado = 'activo' AND r.nombre = 'empleado'
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los usuarios empleados." });
  }
};

// Obtener todos los usuarios con sus roles
export const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.username, u.tipo_documento, u.documento, u.nombres, u.apellidos,
        u.correo, u.sangre, u.telefono, u.cargo, u.area, u.empresa,
        u.acudiente, u.tipo_acudiente, u.numero_acudiente, u.direccion,
        u.eps, u.arl, u.brigadista, u.password, u.estado, u.asiento,
        u.code_expiration, u.created_at, u.updated_at,
        u.enfermedades, u.alergias,
        COALESCE(
          json_agg(json_build_object('nombre', r.nombre)) 
            FILTER (WHERE r.nombre IS NOT NULL),
          '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener todos los usuarios." });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        u.id, u.username, u.tipo_documento, u.documento, u.nombres, u.apellidos,
        u.correo, u.sangre, u.telefono, u.cargo, u.area, u.subarea, u.empresa,
        u.acudiente, u.tipo_acudiente, u.numero_acudiente, u.direccion,
        u.eps, u.arl, u.brigadista, u.password, u.estado, u.asiento,
        u.code_expiration, u.created_at, u.updated_at,
        u.enfermedades, u.alergias,
        COALESCE(
          json_agg(json_build_object('nombre', r.nombre)) 
            FILTER (WHERE r.nombre IS NOT NULL),
          '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener el usuario." });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;
    const {
      username,
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
      cargo,
      empresa,
      area,
      subarea,
      arl,
      enfermedades,
      alergias,
      estado,
      asiento,
      brigadista,
      roles,
    } = req.body;

    await client.query('BEGIN');

    // Verificar si el usuario existe
    const userCheckQuery = 'SELECT * FROM users WHERE id = $1';
    const userCheckResult = await client.query(userCheckQuery, [userId]);

    if (userCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar documento duplicado
    if (documento) {
      const docCheckQuery = `
        SELECT * FROM users 
        WHERE documento = $1 AND id != $2
      `;
      const docCheckResult = await client.query(docCheckQuery, [documento, userId]);

      if (docCheckResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: "Ya existe otro usuario con el mismo documento."
        });
      }
    }

    // Verificar correo duplicado
    if (correo) {
      const emailCheckQuery = `
        SELECT * FROM users 
        WHERE correo = $1 AND id != $2
      `;
      const emailCheckResult = await client.query(emailCheckQuery, [correo, userId]);

      if (emailCheckResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: "Ya existe otro usuario con el mismo correo."
        });
      }
    }

    const normalizarArray = (dato) => {
      if (!dato) return [];
      if (Array.isArray(dato)) return dato.filter(item => item && String(item).trim() !== '');
      if (typeof dato === 'string') {
        try {
          const parsed = JSON.parse(dato);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return dato.split(',').map(item => item.trim()).filter(item => item !== '');
        }
      }
      if (typeof dato === 'object') return Object.keys(dato).filter(key => dato[key]);
      return [];
    };

    const enfermedadesSafe = normalizarArray(enfermedades);
    const alergiasSafe = normalizarArray(alergias);

    // Preparar actualización (SIN incluir password)
    const updateQuery = `
      UPDATE users SET
        username = $1,
        tipo_documento = $2,
        documento = $3,
        nombres = $4,
        apellidos = $5,
        correo = $6,
        sangre = $7,
        telefono = $8,
        acudiente = $9,
        tipo_acudiente = $10,
        numero_acudiente = $11,
        direccion = $12,
        eps = $13,
        cargo = $14,
        empresa = $15,
        area = $16,
        subarea = $17,
        arl = $18,
        enfermedades = $19,
        alergias = $20,
        estado = $21,
        asiento = $22,
        brigadista = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *
    `;

    const params = [
      username, tipo_documento, documento, nombres, apellidos, correo,
      sangre, telefono, acudiente, tipo_acudiente, numero_acudiente,
      direccion, eps, cargo, empresa, area,
      subarea === "" ? null : subarea,
      arl,
      JSON.stringify(enfermedadesSafe),
      JSON.stringify(alergiasSafe),
      estado, asiento, brigadista,
      userId  // $24
    ];

    const updateResult = await client.query(updateQuery, params);

    // Actualizar roles si se proporcionaron
    if (roles && Array.isArray(roles)) {
      // Eliminar roles existentes
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

      // Insertar nuevos roles
      if (roles.length > 0) {
        const rolesQuery = `SELECT id FROM roles WHERE nombre = ANY($1)`;
        const rolesResult = await client.query(rolesQuery, [roles]);

        for (const role of rolesResult.rows) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [userId, role.id]
          );
        }
      }
    }

    await client.query('COMMIT');

    const updatedUser = updateResult.rows[0];

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      correo: updatedUser.correo,
      nombres: updatedUser.nombres,
      apellidos: updatedUser.apellidos,
      roles: roles || [],
      message: `El empleado ${updatedUser.nombres} ${updatedUser.apellidos} se ha actualizado correctamente.`,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar el usuario." });
  } finally {
    client.release();
  }
};

// Actualizar contraseña
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Buscar usuario
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Validar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "La contraseña actual que ingresaste es incorrecta"
      });
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await encryptPassword(newPassword);

    // Actualizar contraseña
    const updateQuery = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(updateQuery, [hashedNewPassword, id]);

    res.status(200).json({ message: "La contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};

// Olvidar contraseña (deprecated - usar sendRandomNumbers + verifyCode + changePassword)
export const forgetPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const { correo, randomNumbers, newPassword } = req.body;

    await client.query('BEGIN');

    // Verificar usuario
    const userQuery = 'SELECT * FROM users WHERE correo = $1';
    const userResult = await client.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Verificar números aleatorios
    if (!user.random_numbers || user.random_numbers.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Código de seguridad no encontrado para el usuario"
      });
    }

    const numbersMatch = randomNumbers.every((num, index) =>
      num === user.random_numbers[index]
    );

    if (!numbersMatch) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: "Código de seguridad incorrecto" });
    }

    // Actualizar contraseña y limpiar números
    const encryptedPassword = await encryptPassword(newPassword);
    const updateQuery = `
      UPDATE users 
      SET password = $1, random_numbers = NULL, code_expiration = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await client.query(updateQuery, [encryptedPassword, user.id]);

    await client.query('COMMIT');

    return res.json({ message: "Contraseña cambiada exitosamente" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al cambiar la contraseña" });
  } finally {
    client.release();
  }
};

// Enviar números aleatorios por correo
export const sendRandomNumbers = async (req, res) => {
  try {
    const { correo } = req.body;

    // Verificar usuario
    const userQuery = 'SELECT * FROM users WHERE correo = $1';
    const userResult = await pool.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Generar 6 números aleatorios
    const randomNumbers = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    );

    // Calcular expiración (10 minutos)
    const codeExpiration = new Date();
    codeExpiration.setMinutes(codeExpiration.getMinutes() + 10);

    // Guardar números y expiración
    const updateQuery = `
      UPDATE users 
      SET random_numbers = $1, code_expiration = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(updateQuery, [randomNumbers, codeExpiration, user.id]);

    // Enviar correo
    await sendMail(
      correo,
      "Código para restablecer contraseña",
      `Tu código de seguridad para restablecer la contraseña es: ${randomNumbers.join("")}`
    );
    console.log("Correo enviado a:", correo);

    console.log("Correo enviado a:", correo);
    console.log("ID del mensaje:", correo);

    return res.status(200).json({
      message: "Código de seguridad enviado al correo exitosamente"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al enviar el código de seguridad al correo"
    });
  }
};

// Verificar código de seguridad
export const verifyCode = async (req, res) => {
  try {
    const { correo, randomNumbers } = req.body;

    // Verificar usuario
    const userQuery = 'SELECT * FROM users WHERE correo = $1';
    const userResult = await pool.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Verificar números aleatorios
    if (!randomNumbers || !Array.isArray(randomNumbers) ||
      !user.random_numbers || !Array.isArray(user.random_numbers)) {
      return res.status(403).json({ message: "Código de seguridad incorrecto" });
    }

    const incomingNums = randomNumbers.map(Number);
    const storedNums = user.random_numbers.map(Number);

    const numbersMatch = incomingNums.length === storedNums.length &&
      incomingNums.every((num, index) => num === storedNums[index]);

    if (!numbersMatch) {
      return res.status(403).json({ message: "Código de seguridad incorrecto" });
    }

    // Verificar expiración
    const currentTime = new Date();
    if (currentTime > new Date(user.code_expiration)) {
      return res.status(401).json({
        message: "El código de seguridad ha expirado. Solicita uno nuevo.",
      });
    }

    // Limpiar números y expiración
    const updateQuery = `
      UPDATE users 
      SET random_numbers = NULL, code_expiration = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(updateQuery, [user.id]);

    return res.json({ message: "Código de seguridad verificado exitosamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al verificar el código de seguridad"
    });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { correo, newPassword } = req.body;

    // Verificar usuario
    const userQuery = 'SELECT * FROM users WHERE correo = $1';
    const userResult = await pool.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Encriptar y actualizar contraseña
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(updateQuery, [encryptedPassword, user.id]);

    return res.status(200).json({ message: "Contraseña cambiada exitosamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};

// Eliminar usuario (desactivar)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar si existe
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Desactivar usuario
    const updateQuery = `
      UPDATE users 
      SET estado = 'inactivo', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(updateQuery, [userId]);

    return res.status(200).json({ message: "Usuario desactivado exitosamente." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al desactivar el usuario." });
  }
};
// Asignar días a todos los usuarios de un área/subárea
export const assignDaysByArea = async (req, res) => {
  try {
    const { area, subarea, dias } = req.body;

    // Validaciones
    if (!dias || !Array.isArray(dias) || dias.length === 0) {
      return res.status(400).json({ message: "Debe seleccionar al menos un día" });
    }

    if (dias.length > 3) {
      return res.status(400).json({ message: "Solo puede seleccionar máximo 3 días" });
    }

    // Construir query dinámico para buscar usuarios
    let userQuery;
    let queryParams;

    if (subarea) {
      // Si hay subárea, filtrar por área Y subárea
      userQuery = 'SELECT id, nombres, apellidos FROM users WHERE area = $1 AND subarea = $2 AND estado = $3';
      queryParams = [area, subarea, 'activo'];
    } else {
      // Si no hay subárea, filtrar solo por área
      userQuery = 'SELECT id, nombres, apellidos FROM users WHERE area = $1 AND estado = $2';
      queryParams = [area, 'activo'];
    }

    const userResult = await pool.query(userQuery, queryParams);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron usuarios activos para el área/subárea especificada"
      });
    }

    // Obtener los IDs de los días desde la tabla dias
    const diasQuery = 'SELECT id, nombre FROM dias WHERE nombre = ANY($1)';
    const diasResult = await pool.query(diasQuery, [dias]);

    if (diasResult.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron días válidos" });
    }

    // Verificar si todos los días solicitados existen
    const diasEncontrados = diasResult.rows.map(d => d.nombre);
    const diasNoEncontrados = dias.filter(d => !diasEncontrados.includes(d));

    if (diasNoEncontrados.length > 0) {
      return res.status(400).json({
        message: "Algunos días no son válidos",
        diasNoValidos: diasNoEncontrados
      });
    }

    // Eliminar asignaciones previas de todos los usuarios del área/subárea
    const userIds = userResult.rows.map(user => user.id);
    await pool.query('DELETE FROM dias_users WHERE user_id = ANY($1)', [userIds]);

    // Insertar nuevas asignaciones para todos los usuarios
    const insertPromises = [];
    userResult.rows.forEach(user => {
      diasResult.rows.forEach(dia => {
        insertPromises.push(
          pool.query(
            'INSERT INTO dias_users (user_id, dias_id) VALUES ($1, $2)',
            [user.id, dia.id]
          )
        );
      });
    });

    await Promise.all(insertPromises);

    return res.status(200).json({
      message: "Días asignados exitosamente",
      area: area,
      subarea: subarea || 'Todas las subáreas',
      usuariosAfectados: userResult.rows.length,
      diasAsignados: diasEncontrados
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al asignar días al área/subárea" });
  }
};

// Asignar días a un usuario específico por userId
export const assignDaysByUserId = async (req, res) => {
  try {
    const { userId, dias } = req.body;

    // Validaciones
    if (!dias || !Array.isArray(dias) || dias.length === 0) {
      return res.status(400).json({ message: "Debe seleccionar al menos un día" });
    }

    if (dias.length > 3) {
      return res.status(400).json({ message: "Solo puede seleccionar máximo 3 días" });
    }

    // Verificar que el usuario existe
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Obtener los IDs de los días desde la tabla dias
    const diasQuery = 'SELECT id, nombre FROM dias WHERE nombre = ANY($1)';
    const diasResult = await pool.query(diasQuery, [dias]);

    if (diasResult.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron días válidos" });
    }

    // Verificar si todos los días solicitados existen
    const diasEncontrados = diasResult.rows.map(d => d.nombre);
    const diasNoEncontrados = dias.filter(d => !diasEncontrados.includes(d));

    if (diasNoEncontrados.length > 0) {
      return res.status(400).json({
        message: "Algunos días no son válidos",
        diasNoValidos: diasNoEncontrados
      });
    }

    // Eliminar asignaciones previas del usuario
    await pool.query('DELETE FROM dias_users WHERE user_id = $1', [userId]);

    // Insertar nuevas asignaciones
    const insertPromises = diasResult.rows.map(dia => {
      return pool.query(
        'INSERT INTO dias_users (user_id, dias_id) VALUES ($1, $2)',
        [userId, dia.id]
      );
    });

    await Promise.all(insertPromises);

    return res.status(200).json({
      message: "Días asignados exitosamente al usuario",
      usuario: userResult.rows[0].nombres + ' ' + userResult.rows[0].apellidos,
      area: userResult.rows[0].area,
      subarea: userResult.rows[0].subarea || 'N/A',
      diasAsignados: diasEncontrados
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al asignar días al usuario" });
  }
};
// Asignar área/subárea a múltiples usuarios seleccionados
export const assignAreaToUsers = async (req, res) => {
  try {
    const { userIds, area, subarea } = req.body;

    // Validaciones
    if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
      return res.status(400).json({ message: "Debe seleccionar al menos un usuario" });
    }

    if (!area || area.trim() === '') {
      return res.status(400).json({ message: "Debe proporcionar un área" });
    }

    // Verificar que los usuarios existen
    const checkUsersQuery = 'SELECT id, nombres, apellidos FROM users WHERE id = ANY($1)';
    const checkUsersResult = await pool.query(checkUsersQuery, [userIds]);

    if (checkUsersResult.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron usuarios con los IDs proporcionados" });
    }

    // Verificar si hay usuarios que no existen
    const foundUserIds = checkUsersResult.rows.map(user => user.id);
    const notFoundUserIds = userIds.filter(id => !foundUserIds.includes(id));

    if (notFoundUserIds.length > 0) {
      return res.status(400).json({
        message: "Algunos usuarios no fueron encontrados",
        usuariosNoEncontrados: notFoundUserIds
      });
    }

    // Actualizar área y subárea de los usuarios seleccionados
    let updateQuery;
    let queryParams;

    if (subarea && subarea.trim() !== '') {
      // Si se proporciona subárea, actualizar ambos campos
      updateQuery = `
        UPDATE users 
        SET area = $1, subarea = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($3)
      `;
      queryParams = [area, subarea, userIds];
    } else {
      // Si no hay subárea, actualizar solo área y establecer subárea como NULL
      updateQuery = `
        UPDATE users 
        SET area = $1, subarea = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2)
      `;
      queryParams = [area, userIds];
    }

    await pool.query(updateQuery, queryParams);

    return res.status(200).json({
      message: "Área/subárea asignada exitosamente",
      usuariosActualizados: checkUsersResult.rows.length,
      area: area,
      subarea: subarea || 'Sin subárea',
      usuarios: checkUsersResult.rows.map(u => `${u.nombres} ${u.apellidos}`)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al asignar área/subárea a los usuarios" });
  }
};
export const massiveUserUpdate = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userIds, updates } = req.body;

    // Validaciones
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Debe seleccionar al menos un usuario" });
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Debe proporcionar al menos un campo para actualizar" });
    }

    // Campos permitidos para actualización masiva (agregado dias_presenciales)
    const allowedFields = ['eps', 'arl', 'brigadista', 'sangre', 'area', 'subarea', 'dias_presenciales'];
    const fieldsToUpdate = Object.keys(updates).filter(field => allowedFields.includes(field));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos válidos para actualizar" });
    }

    // Validación especial para dias_presenciales
    if (updates.dias_presenciales) {
      if (!Array.isArray(updates.dias_presenciales)) {
        return res.status(400).json({ message: "dias_presenciales debe ser un array" });
      }
      if (updates.dias_presenciales.length === 0) {
        return res.status(400).json({ message: "Debe seleccionar al menos un día" });
      }
      if (updates.dias_presenciales.length > 3) {
        return res.status(400).json({ message: "Solo puede seleccionar máximo 3 días presenciales" });
      }
    }

    await client.query('BEGIN');

    // Verificar que los usuarios existen y están activos
    const checkUsersQuery = `
      SELECT id, nombres, apellidos, area 
      FROM users 
      WHERE id = ANY($1) AND LOWER(TRIM(estado)) = 'activo'
    `;
    const checkUsersResult = await client.query(checkUsersQuery, [userIds]);

    if (checkUsersResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "No se encontraron usuarios activos con los IDs proporcionados" });
    }

    // Verificar si hay usuarios que no existen o están inactivos
    const foundUserIds = checkUsersResult.rows.map(user => user.id);
    const notFoundUserIds = userIds.filter(id => !foundUserIds.includes(id));

    if (notFoundUserIds.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Algunos usuarios no fueron encontrados o están inactivos",
        usuariosNoEncontrados: notFoundUserIds
      });
    }

    // Separar dias_presenciales de los demás campos
    const diasPresenciales = updates.dias_presenciales;
    const regularFields = fieldsToUpdate.filter(field => field !== 'dias_presenciales');

    // Actualizar campos regulares si existen
    if (regularFields.length > 0) {
      const setClauses = [];
      const queryParams = [];
      let paramIndex = 1;

      regularFields.forEach(field => {
        if (field === 'area') {
          setClauses.push(`${field} = $${paramIndex}`);
          queryParams.push(updates[field]);
          paramIndex++;

          // Si no se proporciona subárea en la actualización, resetearla a NULL
          if (!updates.subarea) {
            setClauses.push(`subarea = NULL`);
          }
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          queryParams.push(updates[field]);
          paramIndex++;
        }
      });

      // Agregar updated_at
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      // Agregar los userIds como último parámetro
      queryParams.push(userIds);

      const updateQuery = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE id = ANY($${paramIndex})
        RETURNING id, nombres, apellidos
      `;

      await client.query(updateQuery, queryParams);
    }

    // Actualizar días presenciales si se proporcionaron
    if (diasPresenciales && diasPresenciales.length > 0) {
      // Obtener los IDs de los días desde la tabla dias
      const diasQuery = 'SELECT id, nombre FROM dias WHERE nombre = ANY($1)';
      const diasResult = await client.query(diasQuery, [diasPresenciales]);

      if (diasResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "No se encontraron días válidos" });
      }

      // Verificar si todos los días solicitados existen
      const diasEncontrados = diasResult.rows.map(d => d.nombre);
      const diasNoEncontrados = diasPresenciales.filter(d => !diasEncontrados.includes(d));

      if (diasNoEncontrados.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: "Algunos días no son válidos",
          diasNoValidos: diasNoEncontrados
        });
      }

      // Eliminar asignaciones previas de todos los usuarios seleccionados
      await client.query('DELETE FROM dias_users WHERE user_id = ANY($1)', [foundUserIds]);

      // Insertar nuevas asignaciones para todos los usuarios
      const insertPromises = [];
      foundUserIds.forEach(userId => {
        diasResult.rows.forEach(dia => {
          insertPromises.push(
            client.query(
              'INSERT INTO dias_users (user_id, dias_id) VALUES ($1, $2)',
              [userId, dia.id]
            )
          );
        });
      });

      await Promise.all(insertPromises);
    }

    await client.query('COMMIT');

    // Preparar respuesta con los cambios realizados
    const cambiosRealizados = {};
    fieldsToUpdate.forEach(field => {
      const fieldNames = {
        eps: 'EPS',
        arl: 'ARL',
        brigadista: 'Brigadista',
        sangre: 'Tipo de Sangre',
        area: 'Área',
        subarea: 'Subárea',
        dias_presenciales: 'Días Presenciales',
      };

      if (field === 'dias_presenciales') {
        cambiosRealizados[fieldNames[field]] = updates[field].join(', ');
      } else {
        cambiosRealizados[fieldNames[field]] = updates[field];
      }
    });

    return res.status(200).json({
      message: "Actualización masiva realizada exitosamente",
      usuariosActualizados: foundUserIds.length,
      cambiosRealizados: cambiosRealizados,
      usuarios: checkUsersResult.rows.map(u => `${u.nombres} ${u.apellidos}`)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en actualización masiva:', error);
    return res.status(500).json({
      message: "Error al realizar la actualización masiva",
      error: error.message
    });
  } finally {
    client.release();
  }
};
// Trae los días que tiene asignado un usuario
export const getUserDays = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT d.nombre, d.id
      FROM dias_users du
      JOIN dias d ON du.dias_id = d.id
      WHERE du.user_id = $1
      ORDER BY d.id
    `;

    const result = await pool.query(query, [userId]);
    const dias = result.rows.map(row => row.nombre);

    return res.status(200).json({ dias });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener días del usuario" });
  }
};
export const getAllUsersDays = async (req, res) => {
  try {
    const query = `
      SELECT 
        du.user_id,
        COALESCE(
          json_agg(
            d.nombre ORDER BY d.id
          ) FILTER (WHERE d.nombre IS NOT NULL),
          '[]'
        ) AS dias
      FROM users u
      LEFT JOIN dias_users du ON u.id = du.user_id
      LEFT JOIN dias d ON du.dias_id = d.id
      WHERE u.estado = 'activo'
      GROUP BY du.user_id, u.id
      ORDER BY u.id
    `;

    const result = await pool.query(query);

    // Convertir el resultado a un objeto con user_id como clave
    const userDaysMap = {};
    result.rows.forEach(row => {
      if (row.user_id) {
        userDaysMap[row.user_id] = row.dias;
      }
    });

    return res.status(200).json(userDaysMap);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener días de los usuarios" });
  }
};