import pool from '../database.js';
import moment from 'moment';
import cron from 'node-cron';
moment.locale('es-us');

// Crear visitante
export const createVisitante = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      tipo_documento, documento, nombres, apellidos, sangre, telefono,
      direccion, eps, arl, enfermedades, alergias
    } = req.body;

    await client.query('BEGIN');

    // Verificar si existe
    const existingQuery = 'SELECT * FROM visitantes WHERE documento = $1';
    const existingResult = await client.query(existingQuery, [documento]);

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: "Ya existe un visitante con el mismo documento."
      });
    }

    // Crear visitante
    const insertQuery = `
      INSERT INTO visitantes (
        tipo_documento, documento, nombres, apellidos, sangre, telefono,
        direccion, eps, arl, enfermedades, alergias
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const result = await client.query(insertQuery, [
      tipo_documento, documento, nombres, apellidos, sangre, telefono,
      JSON.stringify(direccion), eps, arl, JSON.stringify(enfermedades), JSON.stringify(alergias)
    ]);

    await client.query('COMMIT');

    const visitante = result.rows[0];
    res.status(201).json({
      message: `Se ha creado a ${visitante.nombres} como visitante.`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al crear visitante." });
  } finally {
    client.release();
  }
};

// Obtener todos los visitantes
export const getVisitantes = async (req, res) => {
  try {
    const query = 'SELECT id as id, tipo_documento, documento, nombres, apellidos, sangre, telefono, direccion, eps, arl, enfermedades, alergias FROM visitantes ORDER BY created_at DESC';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener visitantes." });
  }
};

// Obtener visitante por ID
export const getVisitantesById = async (req, res) => {
  try {
    const { visitanteId } = req.params;

    const query = 'SELECT * FROM visitantes WHERE id = $1';
    const result = await pool.query(query, [visitanteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Visitante no encontrado" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener el visitante",
      error: error.message
    });
  }
};

// Actualizar visitante
export const updateVisitanteById = async (req, res) => {
  const client = await pool.connect();

  try {
    const { visitanteId } = req.params;

    await client.query('BEGIN');

    const {
      tipo_documento, documento, nombres, apellidos, sangre, telefono,
      direccion, eps, arl, enfermedades, alergias
    } = req.body;

    const updateQuery = `
      UPDATE visitantes 
      SET tipo_documento = $1, documento = $2, nombres = $3, apellidos = $4,
          sangre = $5, telefono = $6, direccion = $7, eps = $8, arl = $9,
          enfermedades = $10, alergias = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;
    const result = await client.query(updateQuery, [
      tipo_documento, documento, nombres, apellidos, sangre, telefono,
      direccion, eps, arl, enfermedades, alergias, visitanteId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Visitante no encontrado" });
    }

    await client.query('COMMIT');

    const visitante = result.rows[0];
    res.status(200).json({
      message: `El visitante ${visitante.nombres} ${visitante.apellidos} se ha actualizado correctamente.`,
      data: visitante
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({
      message: "Error al actualizar el visitante",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Eliminar visitante
export const deleteVisitanteById = async (req, res) => {
  try {
    const { visitanteId } = req.params;

    const deleteQuery = 'DELETE FROM visitantes WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [visitanteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Visitante no encontrado" });
    }

    res.status(204).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al eliminar el visitante",
      error: error.message
    });
  }
};

// Crear reserva visitante
export const createReservaVisitante = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { visitanteId } = req.params;
    const {
      fechaReserva,
      responsable_mobilize,
      motivo,
      acudiente,
      tipo_acudiente,
      numero_acudiente,
      numeroSilla,
      hora_llegada,
      hora_salida
    } = req.body;
    const horaLlegadaArray = hora_llegada
  ? Array.isArray(hora_llegada)
    ? hora_llegada
    : [hora_llegada]
  : [];

const horaSalidaArray = hora_salida
  ? Array.isArray(hora_salida)
    ? hora_salida
    : [hora_salida]
  : [];

    if (!visitanteId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'visitanteId es requerido y no puede ser undefined'
      });
    }

    const fechaReservaFormatted = moment(fechaReserva).startOf('day').format('YYYY-MM-DD');

    // Obtener el user_id del responsable_mobilize
    const [nombres, ...apellidosArray] = responsable_mobilize.split(' ');
    const apellidos = apellidosArray.join(' ');

    const userResult = await client.query(
      'SELECT id FROM users WHERE nombres = $1 AND apellidos = $2',
      [nombres, apellidos]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: "Responsable no encontrado en el sistema."
      });
    }

    const userId = userResult.rows[0].id;

    // Verificar si el visitante ya tiene una reserva para esta fecha
    const existingReservaVisitante = await client.query(
      `SELECT * FROM reservas 
       WHERE visitante_id = $1 
       AND fecha_reserva::date = $2::date 
       AND tipo = 'visitante'`,
      [visitanteId, fechaReservaFormatted]
    );

    if (existingReservaVisitante.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "El visitante ya tiene una reserva para esta fecha.",
      });
    }

    // Buscar o crear oficina para la fecha
    const oficinaResult = await client.query(
      'SELECT * FROM oficinas WHERE fecha = $1',
      [fechaReservaFormatted]
    );

    let oficinaId;
    let asientosDisponibles;

    if (oficinaResult.rows.length === 0) {
      // Crear nueva oficina
      const newOficinaResult = await client.query(
        'INSERT INTO oficinas (fecha, asientos_disponibles) VALUES ($1, $2) RETURNING id',
        [fechaReservaFormatted, 79]
      );
      oficinaId = newOficinaResult.rows[0].id;
      asientosDisponibles = 79;
    } else {
      oficinaId = oficinaResult.rows[0].id;
      asientosDisponibles = oficinaResult.rows[0].asientos_disponibles;

      // Si se proporciona número de silla, verificar que no esté ocupado
      if (numeroSilla) {
        const sillaReservada = await client.query(
          `SELECT * FROM reservas 
           WHERE oficina_id = $1 
           AND numero_silla = $2 
           AND fecha_reserva::date = $3::date`,
          [oficinaId, numeroSilla, fechaReservaFormatted]
        );

        if (sillaReservada.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: "El número de silla ya está reservado para esta fecha.",
          });
        }
      }

      if (asientosDisponibles <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `La oficina ha alcanzado su límite para el día ${moment(fechaReserva).format("DD [de] MMMM [del] YYYY")}.`,
        });
      }
    }

    // Crear la reserva de visitante en la tabla reservas
    await client.query(
      `INSERT INTO reservas 
       (user_id, visitante_id, oficina_id, fecha_reserva, numero_silla, tipo,
        visitante_responsable_mobilize, visitante_motivo, visitante_acudiente, 
        visitante_tipo_acudiente, visitante_numero_acudiente, hora_llegada, hora_salida, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId,
        visitanteId,
        oficinaId,
        fechaReserva,
        numeroSilla || null,
        'visitante',
        responsable_mobilize,
        motivo,
        acudiente,
        tipo_acudiente,
        numero_acudiente,
        horaLlegadaArray,
        horaSalidaArray,
        'programado'
      ]
    );

    // Actualizar asientos disponibles solo si se asignó número de silla
    if (numeroSilla) {
      await client.query(
        'UPDATE oficinas SET asientos_disponibles = asientos_disponibles - 1 WHERE id = $1',
        [oficinaId]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: "Reserva de visitante creada exitosamente." });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al crear reserva de visitante:", error);
    return res.status(500).json({ message: "Error al crear la reserva de visitante." });
  } finally {
    client.release();
  }
};

// Eliminar reserva visitante
export const deleteReservaVisitanteByUserId = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, fechaReserva } = req.params;

    await client.query('BEGIN');
    const reservaResult = await client.query(
      `SELECT r.*, o.id as oficina_id
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       WHERE r.id = $1                         
         AND r.fecha_reserva::date = $2::date
         AND r.tipo = 'visitante'`,
      [userId, fechaReserva]
    );

    if (reservaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'No se encontró reserva de visitante para esta fecha.'
      });
    }

    const reserva = reservaResult.rows[0];
    await client.query(
      'DELETE FROM reservas WHERE id = $1',
      [reserva.id]
    );
    await client.query(
      'UPDATE oficinas SET asientos_disponibles = asientos_disponibles + 1 WHERE id = $1',
      [reserva.oficina_id]
    );

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Reserva de visitante eliminada exitosamente.',
      reserva
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar reserva de visitante:', error);
    return res.status(500).json({
      message: 'Error al eliminar la reserva de visitante.'
    });
  } finally {
    client.release();
  }
};

export const deleteReservaVisitanteByVisitanteId = async (req, res) => {
    const client = await pool.connect();
  try {
    const { visitanteId, fechaReserva } = req.params;

    await client.query('BEGIN');

    // Simplemente usa la fecha como string en formato YYYY-MM-DD
    const deleteQuery = `
      DELETE FROM reservas 
      WHERE visitante_id = $1 
        AND fecha_reserva::date = $2::date 
        AND tipo = 'visitante'
      RETURNING *
    `;
//
    const result = await client.query(deleteQuery, [
      visitanteId,
      fechaReserva  // Ya viene en formato YYYY-MM-DD desde el frontend
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'No se encontró reserva de visitante para esta fecha.'
      });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Reserva de visitante eliminada exitosamente.',
      reserva: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar reserva de visitante:', error);
    return res.status(500).json({
      message: 'Error al eliminar la reserva de visitante.'
    });
  } finally {
    client.release();
  }
};
// Actualizar reserva visitante
export const updateReservaVisitante = async (req, res) => {
  const client = await pool.connect();

  try {
    const { visitanteId, fechaReserva } = req.params;
    const {
      responsable_mobilize,
      motivo,
      acudiente,
      tipo_acudiente,
      numero_acudiente
    } = req.body;

    await client.query('BEGIN');

    const formattedFechaReserva = moment.utc(fechaReserva).startOf('day').toDate();

    const updateQuery = `
      UPDATE reservas_visitante
      SET responsable_mobilize = $1, motivo = $2, acudiente = $3,
          tipo_acudiente = $4, numero_acudiente = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE visitante_id = $6 AND fecha_reserva::date = $7::date
      RETURNING *
    `;
    const result = await client.query(updateQuery, [
      responsable_mobilize, motivo, acudiente, tipo_acudiente,
      numero_acudiente, visitanteId, formattedFechaReserva
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: 'No se encontró una reserva para la fecha especificada.'
      });
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Reserva actualizada exitosamente.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la reserva.' });
  } finally {
    client.release();
  }
};

// Obtener reservas visitante por fecha
export const getReservasVisitanteByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const fechaInicio = moment(fecha).startOf("day").toDate();
    const fechaFin = moment(fecha).endOf("day").toDate();

    const query = `
      SELECT 
        v.*,
        rv.fecha_reserva,
        rv.responsable_mobilize,
        rv.motivo,
        rv.acudiente,
        rv.tipo_acudiente,
        rv.numero_acudiente
      FROM visitantes v
      INNER JOIN reservas_visitante rv ON v.id = rv.visitante_id
      WHERE rv.fecha_reserva >= $1 AND rv.fecha_reserva <= $2
      ORDER BY rv.fecha_reserva
    `;
    const result = await pool.query(query, [fechaInicio, fechaFin]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No se encontró reservaciones para ${moment(fecha).format("DD [de] MMMM [del] YYYY")}.`,
      });
    }

    return res.status(200).json({ data: { reservas: result.rows } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las reservas." });
  }
};

// Obtener reservas visitante por rango de fechas
export const getReservasVisitantePorRangoDeFechas = async (req, res) => {
  const { fechaInicial, fechaFinal } = req.query;

  try {
    const fechaInicio = new Date(fechaInicial);
    const fechaFin = new Date(fechaFinal);

    const query = `
      SELECT 
        o.id as oficina_id,
        o.fecha,
        o.asientos_disponibles,
        v.*,
        rv.fecha_reserva,
        rv.responsable_mobilize,
        rv.motivo,
        rv.acudiente,
        rv.tipo_acudiente,
        rv.numero_acudiente
      FROM oficinas o
      INNER JOIN reservas_visitante rv ON o.id = rv.oficina_id
      INNER JOIN visitantes v ON rv.visitante_id = v.id
      WHERE o.fecha >= $1 AND o.fecha <= $2
      ORDER BY o.fecha
    `;
    const result = await pool.query(query, [fechaInicio, fechaFin]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al obtener las reservas de visitantes."
    });
  }
};
export const actualizarEstadoReservaVisitantes = cron.schedule(
  "*/5 * * * *", // se ejecuta cada 5 minutos
  async () => {
    try {
      /*Activa la reserva del visitante si ya pasó la hora de llegada */
      await pool.query(`
        UPDATE reservas
        SET estado = 'activo'
        WHERE tipo = 'visitante'
          AND fecha_reserva = CURRENT_DATE
          AND hora_llegada IS NOT NULL
          AND hora_salida IS NOT NULL
          AND CURRENT_TIME >= hora_llegada[1]::time
          AND CURRENT_TIME < hora_salida[1]::time
      `);

      /*
        Desactiva la reserva del visitante si ya pasó la hora de salida
      */
      await pool.query(`
        UPDATE reservas
        SET estado = 'inactivo_visitante'
        WHERE tipo = 'visitante'
          AND fecha_reserva = CURRENT_DATE
          AND hora_salida IS NOT NULL
          AND CURRENT_TIME >= hora_salida[1]::time
      `);

    } catch (error) {
      console.error("Error en la tarea programada de las reservas de visitantes:", error);
    }
  },
  {
    timezone: "America/Bogota"
  }
);