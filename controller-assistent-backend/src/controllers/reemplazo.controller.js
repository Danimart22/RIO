import pool from "../database.js";
import moment from 'moment';

// Crear reemplazo
export const createReemplazo = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      tipo_documento,
      documento,
      nombres,
      apellidos,
      sangre,
      telefono,
      cargo,
      acudiente,
      tipo_acudiente,
      numero_acudiente,
      direccion,
      eps,
      arl,
      enfermedades,
      alergias,
      estado,
      fechas_de_reemplazo, // Array de objetos { desde, hasta, usuarios: [] }
    } = req.body;

    await client.query('BEGIN');

    // Verificar si existe
    const existingQuery = 'SELECT * FROM reemplazos WHERE documento = $1';
    const existingResult = await client.query(existingQuery, [documento]);

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Ya existe un reemplazo con este documento."
      });
    }

    // Crear reemplazo
    const insertReemplazoQuery = `
      INSERT INTO reemplazos (
        tipo_documento, documento, nombres, apellidos, sangre, telefono,
        cargo, acudiente, tipo_acudiente, numero_acudiente, direccion,
        eps, arl, enfermedades, alergias, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const reemplazoResult = await client.query(insertReemplazoQuery, [
      tipo_documento, documento, nombres, apellidos, sangre, telefono,
      cargo, acudiente, tipo_acudiente, numero_acudiente, direccion,
      eps, arl, JSON.stringify(enfermedades ?? []), JSON.stringify(alergias ?? []), estado || 'activo'
    ]);

    const reemplazo = reemplazoResult.rows[0];

    // Asignar usuarios al reemplazo
    if (fechas_de_reemplazo && fechas_de_reemplazo.length > 0) {
      for (const fecha of fechas_de_reemplazo) {
        for (const userId of fecha.usuarios) {
          // Insertar en tabla de asignaciones
          const insertAsignacionQuery = `
            INSERT INTO reemplazo_usuarios (
              reemplazo_id, user_id, desde, hasta
            ) VALUES ($1, $2, $3, $4)
          `;
          await client.query(insertAsignacionQuery, [
            reemplazo.id, userId, fecha.desde, fecha.hasta
          ]);
        }
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: "Reemplazo creado exitosamente.",
      reemplazo
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al crear el reemplazo." });
  } finally {
    client.release();
  }
};

// Obtener todos los reemplazos
export const getReemplazo = async (req, res) => {
  try {
    const query = `
      SELECT 
        id as id, tipo_documento, documento, nombres, apellidos, sangre, telefono,
        cargo, acudiente, tipo_acudiente, numero_acudiente, direccion,
        eps, arl, enfermedades, alergias
      FROM reemplazos
      WHERE estado = 'activo'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error obteniendo los reemplazos:", error);
    res.status(500).json({ message: "Error obteniendo los reemplazos" });
  }
};

// Eliminar reemplazo
export const deleteReemplazo = async (req, res) => {
  const client = await pool.connect();

  try {
    const { reemplazoId } = req.params;

    await client.query('BEGIN');

    // Desvincular reservas que referencian este reemplazo
    await client.query(
      'UPDATE reservas SET reemplazo_id = NULL WHERE reemplazo_id = $1',
      [reemplazoId]
    );

    // Eliminar asignaciones de usuarios
    await client.query(
      'DELETE FROM reemplazo_usuarios WHERE reemplazo_id = $1',
      [reemplazoId]
    );

    // Eliminar el reemplazo
    const result = await client.query(
      'DELETE FROM reemplazos WHERE id = $1 RETURNING *',
      [reemplazoId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Reemplazo no encontrado" });
    }

    const reemplazo = result.rows[0];

    await client.query('COMMIT');
    res.status(200).json({
      message: "Reemplazo eliminado correctamente",
      reemplazo
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al eliminar el reemplazo:", error);
    res.status(500).json({ message: "Error al eliminar el reemplazo" });
  } finally {
    client.release();
  }
};

// Asignar reemplazo
export const asignarReemplazo = async (req, res) => {
  const client = await pool.connect();

  try {
    const { usuarioId, reemplazoId, desde, hasta } = req.body;
    await client.query('BEGIN');

    // Validar fechas
    if (!desde || !hasta || moment(desde).isAfter(moment(hasta))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Las fechas proporcionadas no son válidas.'
      });
    }

    // Verificar si ya existe una asignación en esas fechas
    const existingQuery = `
      SELECT * FROM reemplazo_usuarios
      WHERE user_id = $1 
        AND (
          (desde <= $2 AND hasta >= $2) OR
          (desde <= $3 AND hasta >= $3) OR
          (desde >= $2 AND hasta <= $3)
        )
    `;
    const existingResult = await client.query(existingQuery, [
      usuarioId, desde, hasta
    ]);

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'El usuario ya tiene un reemplazo asignado para estas fechas.'
      });
    }

    // Crear asignación en reemplazo_usuarios
    const insertQuery = `
      INSERT INTO reemplazo_usuarios (
        reemplazo_id, user_id, desde, hasta
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    await client.query(insertQuery, [reemplazoId, usuarioId, desde, hasta]);

    // Crear reservas en oficina para cada fecha del rango
    const fechaInicio = moment(desde);
    const fechaFin = moment(hasta);
    const fechas = [];

    while (fechaInicio.isSameOrBefore(fechaFin, 'day')) {
      fechas.push(fechaInicio.clone().toDate());
      fechaInicio.add(1, 'day');
    }

    for (const fecha of fechas) {
      // Buscar o crear oficina
      let oficinaQuery = 'SELECT id FROM oficinas WHERE fecha::date = $1::date';
      let oficinaResult = await client.query(oficinaQuery, [fecha]);
      let oficinaId;

      if (oficinaResult.rows.length === 0) {
        const insertOficinaQuery = `
          INSERT INTO oficinas (id, fecha, asientos_disponibles)
          VALUES (gen_random_uuid(), $1, 80)
          RETURNING id
        `;
        const newOficinaResult = await client.query(insertOficinaQuery, [fecha]);
        oficinaId = newOficinaResult.rows[0].id;
      } else {
        oficinaId = oficinaResult.rows[0].id;
      }

      // Verificar si ya existe la reserva antes de insertar
      const checkReservaQuery = `
        SELECT id FROM reservas
        WHERE oficina_id = $1 
          AND user_id = $2 
          AND reemplazo_id = $3
          AND fecha_reserva::date = $4::date
      `;
      const existingReserva = await client.query(checkReservaQuery, [
        oficinaId, usuarioId, reemplazoId, fecha
      ]);

      // Solo insertar si no existe
      if (existingReserva.rows.length === 0) {
        const insertReservaQuery = `
          INSERT INTO reservas (
            id,
            oficina_id,
            user_id,
            visitante_id,
            reemplazo_id,
            tipo,
            fecha_reserva,
            hora_llegada,
            hora_salida,
            numero_silla,
            visitante_responsable_mobilize,
            visitante_motivo,
            visitante_acudiente,
            visitante_tipo_acudiente,
            visitante_numero_acudiente,
            desde,
            hasta
          ) VALUES (
            gen_random_uuid(),
            $1, $2, NULL, $3, 'reemplazo', $4,
            NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            $5, $6
          )
        `;
        await client.query(insertReservaQuery, [
          oficinaId, usuarioId, reemplazoId, fecha, desde, hasta
        ]);
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Reemplazo asignado exitosamente.',
      fechas_creadas: fechas.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en asignarReemplazo:', error);
    return res.status(500).json({
      message: 'Error al asignar el reemplazo.',
      error: error.message
    });
  } finally {
    client.release();
  }
};
// Obtener reemplazo por fecha
export const getReemplazoByFecha = async (req, res) => {
  try {
    const { userId, fecha } = req.params;
    const fechaBusqueda = new Date(fecha);

    const query = `
      SELECT r.*
      FROM reemplazos r
      INNER JOIN reemplazo_usuarios ru ON r.id = ru.reemplazo_id
      WHERE ru.user_id = $1 
        AND ru.desde <= $2 
        AND ru.hasta >= $2
      LIMIT 1
    `;
    const result = await pool.query(query, [userId, fechaBusqueda]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'No se encontró ningún reemplazo para el usuario en la fecha especificada.'
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener los datos del reemplazo.'
    });
  }
};

// Eliminar asignación de reemplazo
export const eliminarAsignacionReemplazo = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, reemplazoId } = req.params;

    await client.query('BEGIN');

    // Eliminar reservas de reemplazo
    const deleteReservasQuery = `
      DELETE FROM reservas_reemplazo 
      WHERE user_id = $1 AND reemplazo_id = $2
    `;
    await client.query(deleteReservasQuery, [userId, reemplazoId]);

    // Eliminar asignación
    const deleteAsignacionQuery = `
      DELETE FROM reemplazo_usuarios 
      WHERE user_id = $1 AND reemplazo_id = $2
      RETURNING *
    `;
    const result = await client.query(deleteAsignacionQuery, [userId, reemplazoId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Asignación no encontrada.' });
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Reemplazo eliminado exitosamente.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar el reemplazo.' });
  } finally {
    client.release();
  }
};