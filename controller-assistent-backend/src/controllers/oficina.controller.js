import pool from "../database.js";
import moment from 'moment-timezone';
import cron from 'node-cron';
moment.locale("es-us");

const horaLlegadaMaxima = process.env.HORA_LLEGADA_MAXIMA;
const [hora, minuto] = horaLlegadaMaxima.split(":");
const cronExpressionTardanza = `${minuto} ${hora} * * *`;
const horaSalida = process.env.HORA_SALIDA;
const [horaS, minutoS] = horaSalida.split(":");
const cronExpressionSalida = `${minutoS} ${horaS} * * *`;
if (!horaLlegadaMaxima || !horaSalida) {
  throw new Error("Variables de entorno HORA_LLEGADA_MAXIMA o HORA_SALIDA no definidas");
}
function sumarMinutosAHora(horaHHmm, minutosASumar) {
  const [h, m] = horaHHmm.split(":").map(Number);

  let totalMinutos = h * 60 + m + minutosASumar;
  totalMinutos = totalMinutos % (24 * 60);

  const nuevaHora = Math.floor(totalMinutos / 60);
  const nuevoMinuto = totalMinutos % 60;

  return `${nuevoMinuto} ${nuevaHora} * * *`;
}
const cronExpressionTardanzaTIN = sumarMinutosAHora(
  horaLlegadaMaxima,
  30
);
// Crear una reserva en la oficina
export const createReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { fechaReserva, numeroSilla, tipo } = req.body;
    const { usuarioId } = req.params;

    const fechaReservaFormatted = moment(fechaReserva).startOf("day").format('YYYY-MM-DD');

    // Obtener documento del usuario
    const userResult = await client.query(
      'SELECT documento FROM users WHERE id = $1',
      [usuarioId]
    );

    // CAMBIO 1: Verificar si el asiento está ocupado (solo estado 'activo')
    const asientoOcupado = await client.query(
      `SELECT * FROM reservas 
       WHERE numero_silla = $1 
       AND fecha_reserva::date = $2::date 
       AND estado = 'activo'`,
      [numeroSilla, fechaReservaFormatted]
    );

    if (asientoOcupado.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "El asiento ya está ocupado para esta fecha.",
      });
    }

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const documentoUsuario = userResult.rows[0].documento;

    // Buscar oficina existente para la fecha
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

      // Verificar si el usuario ya tiene reserva para esta fecha (solo para tipo "usuario")
      if (tipo === "usuario") {
        const existingUserReserva = await client.query(
          `SELECT * FROM reservas 
           WHERE user_id = $1 
           AND fecha_reserva::date = $2::date 
           AND tipo = 'usuario'
           AND estado = 'activo'`,
          [usuarioId, fechaReservaFormatted]
        );

        if (existingUserReserva.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: "Ya tienes una reserva activa como usuario para esta fecha.",
          });
        }
      }

      // CAMBIO 2: Esta validación ya no es necesaria porque la hicimos al inicio
      // pero la dejamos por si acaso, agregando el filtro de estado 'activo'
      const sillaReservada = await client.query(
        `SELECT * FROM reservas 
         WHERE oficina_id = $1 
         AND numero_silla = $2 
         AND fecha_reserva::date = $3::date
         AND estado = 'activo'`,
        [oficinaId, numeroSilla, fechaReservaFormatted]
      );

      if (sillaReservada.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: "El número de silla ya está reservado para esta fecha.",
        });
      }

      if (asientosDisponibles <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `La oficina ha alcanzado su límite para el día ${moment(fechaReserva).format("DD [de] MMMM [del] YYYY")}.`,
        });
      }
    }

    // Crear la reserva
    await client.query(
      `INSERT INTO reservas 
       (user_id, oficina_id, fecha_reserva, numero_silla, tipo, estado) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuarioId, oficinaId, fechaReserva, numeroSilla, tipo, "activo"]
    );

    // Actualizar asientos disponibles
    await client.query(
      'UPDATE oficinas SET asientos_disponibles = asientos_disponibles - 1 WHERE id = $1',
      [oficinaId]
    );

    await client.query('COMMIT');
    return res.status(200).json({ message: "Reserva creada exitosamente." });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al crear la reserva." });
  } finally {
    client.release();
  }
};

// Actualizar una reserva
export const updateReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { fechaReserva, numeroSilla } = req.body;
    const { usuarioId } = req.params;

    const fechaReservaFormatted = moment(fechaReserva).startOf("day").format('YYYY-MM-DD');

    // Verificar que el usuario existe
    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [usuarioId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Buscar la reserva del usuario
    const reservaResult = await client.query(
      `SELECT r.*, o.id as oficina_id 
       FROM reservas r 
       JOIN oficinas o ON r.oficina_id = o.id 
       WHERE r.user_id = $1 
       AND r.fecha_reserva::date = $2::date`,
      [usuarioId, fechaReservaFormatted]
    );

    if (reservaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "El usuario no tiene una reserva para esta fecha."
      });
    }

    const reservaActual = reservaResult.rows[0];

    // Validar que el número de silla no esté ocupado por otro usuario
    const sillaOcupada = await client.query(
      `SELECT * FROM reservas 
       WHERE oficina_id = $1 
       AND numero_silla = $2 
       AND user_id != $3 
       AND fecha_reserva::date = $4::date`,
      [reservaActual.oficina_id, numeroSilla, usuarioId, fechaReservaFormatted]
    );

    if (sillaOcupada.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "El número de silla ya está reservado para esta fecha.",
      });
    }

    // Actualizar el número de silla
    await client.query(
      `UPDATE reservas 
       SET numero_silla = $1 
       WHERE id = $2`,
      [numeroSilla, reservaActual.id]
    );

    await client.query('COMMIT');
    return res.status(200).json({ message: "Reserva actualizada exitosamente." });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar la reserva:", error);
    return res.status(500).json({ message: "Error al actualizar la reserva." });
  } finally {
    client.release();
  }
};

// Obtener sillas reservadas por fecha
export const getSillasReservadas = async (req, res) => {
  try {
    const { fecha } = req.params;

    // Validar fecha
    if (!fecha || !moment(fecha, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({
        message: "Fecha inválida. El formato debe ser YYYY-MM-DD."
      });
    }

    const fechaFormatted = moment(fecha).startOf("day").format("YYYY-MM-DD");

    const result = await pool.query(
      `
  SELECT DISTINCT r.numero_silla
FROM reservas r
WHERE r.fecha_reserva::date = $1::date
  AND r.numero_silla IS NOT NULL
  AND (
    r.estado IN ('activo')
    OR r.estado IS NULL
  )
ORDER BY r.numero_silla;

  `,
      [fechaFormatted]
    );


    // Siempre devolver array
    const numerosSillaReservados = result.rows.map(row => row.numero_silla);
    return res.status(200).json(numerosSillaReservados);

  } catch (error) {
    console.error("Error en getSillasReservadas:", error);
    return res.status(500).json({
      error: "Error al obtener los números de sillas reservadas."
    });
  }
};


// Obtener todas las reservas
export const getReservas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.*,
        o.fecha,
        o.asientos_disponibles,
        u.nombres, u.apellidos, u.correo, u.enfermedades, u.alergias,
        u.arl, u.eps, u.direccion, u.numero_acudiente, u.tipo_acudiente, u.acudiente
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id IS NOT NULL
       ORDER BY o.fecha DESC, r.fecha_reserva DESC`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron reservas." });
    }

    // Agrupar por oficina
    const reservasPorOficina = result.rows.reduce((acc, row) => {
      const oficinaKey = row.fecha;
      if (!acc[oficinaKey]) {
        acc[oficinaKey] = {
          fecha: row.fecha,
          asientosDisponibles: row.asientos_disponibles,
          reservas: []
        };
      }
      acc[oficinaKey].reservas.push({
        id: row.id,
        user_id: row.user_id, // ← AGREGAR ESTA LÍNEA
        usuario: {
          id: row.user_id, // ← AGREGAR TAMBIÉN AQUÍ (opcional, para mayor claridad)
          nombres: row.nombres,
          apellidos: row.apellidos,
          correo: row.correo,
          enfermedades: row.enfermedades,
          alergias: row.alergias,
          arl: row.arl,
          eps: row.eps,
          direccion: row.direccion,
          numero_acudiente: row.numero_acudiente,
          tipo_acudiente: row.tipo_acudiente,
          acudiente: row.acudiente
        },
        fechaReserva: row.fecha_reserva,
        numeroSilla: row.numero_silla,
        documento: row.documento,
        tipo: row.tipo,
        horaLlegada: row.hora_llegada || [],
        horaSalida: row.hora_salida || []
      });
      return acc;
    }, {});

    const reservas = Object.values(reservasPorOficina);

    return res.status(200).json({ data: { reservas } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las reservas." });
  }
};

// Obtener asistencias por usuario
export const getAsistenciasByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        o.fecha
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       WHERE r.user_id = $1
       AND (array_length(r.hora_llegada, 1) > 0 OR array_length(r.hora_salida, 1) > 0)
       AND r.tipo = 'usuario'
       ORDER BY r.fecha_reserva DESC`,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron asistencias para el usuario especificado.",
      });
    }

    const asistenciasFiltradas = result.rows.map(row => ({
      id: row.id,
      oficina: { fecha: row.fecha },
      fechaReserva: row.fecha_reserva,
      numeroSilla: row.numero_silla,
      horaLlegada: row.hora_llegada || [],
      horaSalida: row.hora_salida || [],
      tipo: row.tipo,
      documento: row.documento
    }));

    return res.status(200).json({ reservas: asistenciasFiltradas });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener las asistencias del usuario."
    });
  }
};
export const getReservasByVisitante = async (req, res) => {
  try {
    const { visitanteId } = req.params;
    const result = await pool.query(
      `SELECT 
        r.id,
        r.fecha_reserva,
        r.numero_silla,
        visitante_id,
        r.tipo,
        o.fecha
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       WHERE r.user_id = $1
       AND r.numero_silla IS NOT NULL AND tipo = 'visitante'
       ORDER BY r.fecha_reserva DESC`,
      [visitanteId]
    );
    const reservasFiltradas = result.rows.map(row => ({
      id: row.id, // ← ESTO FALTABA
      oficina: { fecha: row.fecha },
      visitanteId: row.visitante_id,
      fechaReserva: row.fecha_reserva,
      numeroSilla: row.numero_silla,
      tipo: row.tipo
    }));
    return res.status(200).json({ reservas: reservasFiltradas });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener las reservas del usuario."
    });
  }
};
// Obtener reservas por usuario
export const getReservasByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.id,
        r.fecha_reserva,
        r.numero_silla,
        r.hora_llegada,
        r.hora_salida,
        r.tipo,
        r.estado,
        o.fecha
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       WHERE r.user_id = $1
       AND r.numero_silla IS NOT NULL
       ORDER BY r.fecha_reserva DESC`,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron reservas para el usuario especificado.",
      });
    }

    const reservasFiltradas = result.rows.map(row => ({
      id: row.id, // ← ESTO FALTABA
      oficina: { fecha: row.fecha },
      fechaReserva: row.fecha_reserva,
      numeroSilla: row.numero_silla,
      horaLlegada: row.hora_llegada || [],
      horaSalida: row.hora_salida || [],
      tipo: row.tipo,
      estado: row.estado
    }));

    return res.status(200).json({ reservas: reservasFiltradas });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener las reservas del usuario."
    });
  }
};
// Obtener reservas por fecha
export const getReservasByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;

    const startOfDay = moment(fecha).startOf("day").format('YYYY-MM-DD HH:mm:ss');
    const endOfDay = moment(fecha).endOf("day").format('YYYY-MM-DD HH:mm:ss');

    const result = await pool.query(
      `SELECT 
        r.id,
        r.oficina_id,
        r.user_id,
        r.visitante_id,
        r.reemplazo_id,
        r.tipo,
        r.fecha_reserva,
        r.hora_llegada,
        r.hora_salida,
        r.numero_silla,
        r.estado,
        o.fecha,
        o.asientos_disponibles,
        u.tipo_documento, u.documento, u.nombres, u.apellidos, u.telefono,
        u.correo, u.enfermedades, u.alergias, u.brigadista, u.arl, u.eps,
        u.direccion, u.numero_acudiente, u.tipo_acudiente, u.acudiente
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       JOIN users u ON r.user_id = u.id
       WHERE r.fecha_reserva >= $1 AND r.fecha_reserva <= $2
       ORDER BY r.fecha_reserva`,
      [startOfDay, endOfDay]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron reservas." });
    }

    // Procesar reservas
    const reservasAgrupadas = result.rows.reduce((acc, row) => {
      if (!acc[row.fecha]) {
        acc[row.fecha] = {
          fecha: row.fecha,
          asientosDisponibles: row.asientos_disponibles,
          reservas: []
        };
      }

      // Procesar hora llegada y salida (primera llegada, última salida)
      const horaLlegada = row.hora_llegada && row.hora_llegada.length > 0
        ? [row.hora_llegada[0]]
        : [];
      const horaSalida = row.hora_salida && row.hora_salida.length > 0
        ? [row.hora_salida[row.hora_salida.length - 1]]
        : [];

      acc[row.fecha].reservas.push({
        id: row.id,
        usuario: {
          tipo_documento: row.tipo_documento,
          documento: row.documento,
          nombres: row.nombres,
          apellidos: row.apellidos,
          telefono: row.telefono,
          correo: row.correo,
          enfermedades: row.enfermedades,
          alergias: row.alergias,
          brigadista: row.brigadista,
          arl: row.arl,
          eps: row.eps,
          direccion: row.direccion,
          numero_acudiente: row.numero_acudiente,
          tipo_acudiente: row.tipo_acudiente,
          acudiente: row.acudiente
        },
        fechaReserva: row.fecha_reserva,
        numeroSilla: row.numero_silla,
        horaLlegada,
        horaSalida,
        tipo: row.tipo,
        estado: row.estado,
      });

      return acc;
    }, {});

    const reservas = Object.values(reservasAgrupadas);

    return res.status(200).json({
      data: {
        reservas,
        asientosDisponibles: reservas[0]?.asientosDisponibles || 0
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las reservas." });
  }
};
export const getReservasTardesByRangoFechas = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal} = req.query;
    if (!fechaInicial || !fechaFinal || !horaLlegadaMaxima) {
      return res.status(400).json({
        message: "fechaInicial, fechaFinal y horaLlegadaMaxima son obligatorios"
      });
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.oficina_id,
        r.user_id,
        u.nombres,
        u.apellidos,
        u.documento,
        r.fecha_reserva,
        r.hora_llegada,
        r.hora_salida,
        r.numero_silla,
        r.estado
      FROM reservas r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.tipo = 'usuario'
        AND r.fecha_reserva >= $1
        AND r.fecha_reserva <= $2
        AND r.hora_llegada IS NOT NULL
        AND array_length(r.hora_llegada, 1) > 0
        AND r.hora_llegada[1]::time > $3::time
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
      ORDER BY r.fecha_reserva ASC
      `,
      [fechaInicial, fechaFinal, horaLlegadaMaxima]
    );

    return res.status(200).json({
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error getReservasTardesByRangoFechas:", error);
    return res.status(500).json({
      message: "Error al obtener reservas tardías",
      error: error.message
    });
  }
};


export const getReservasNoAsistieronByRangoFechas = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal } = req.query;

    if (!fechaInicial || !fechaFinal) {
      return res.status(400).json({
        message: "fechaInicial y fechaFinal son obligatorios"
      });
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.oficina_id,
        r.user_id,
        u.nombres,
        u.apellidos,
        u.documento,
        r.fecha_reserva,
        r.hora_llegada,
        r.hora_salida,
        r.numero_silla,
        r.estado
      FROM reservas r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.tipo = 'usuario'
        AND r.fecha_reserva >= $1
        AND r.fecha_reserva <= $2
        AND (
          r.hora_llegada IS NULL
          OR array_length(r.hora_llegada, 1) = 0
        )
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
      ORDER BY r.fecha_reserva ASC
      `,
      [fechaInicial, fechaFinal]
    );

    return res.status(200).json({
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error getReservasNoAsistieronByRangoFechas:", error);
    return res.status(500).json({
      message: "Error al obtener reservas sin asistencia",
      error: error.message
    });
  }
};

export const getReservasLlegaronATiempoByRangoFechas = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal, horaLimite } = req.query;

    if (!fechaInicial || !fechaFinal || !horaLimite) {
      return res.status(400).json({
        message: "fechaInicial, fechaFinal y horaLimite son obligatorios"
      });
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.oficina_id,
        r.user_id,
        u.nombres,
        u.apellidos,
        u.documento,
        r.fecha_reserva,
        r.hora_llegada,
        r.hora_salida,
        r.numero_silla,
        r.estado
      FROM reservas r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.tipo = 'usuario'
        AND r.fecha_reserva >= $1
        AND r.fecha_reserva <= $2
        AND r.hora_llegada IS NOT NULL
        AND array_length(r.hora_llegada, 1) > 0
        AND r.hora_llegada[1]::time <= $3::time
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
      ORDER BY r.fecha_reserva ASC
      `,
      [fechaInicial, fechaFinal, horaLimite]
    );

    return res.status(200).json({
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error getReservasLlegaronATiempoByRangoFechas:", error);
    return res.status(500).json({
      message: "Error al obtener reservas que llegaron a tiempo",
      error: error.message
    });
  }
};



// Importar reservas desde sistema externo
export const importReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventos = req.body.EventCollection.rows;
    let eventosEntradaProcesados = 0;
    let eventosSalidaProcesados = 0;

    for (const evento of eventos) {
      const { user_id, server_datetime, device_id } = evento;
      const userId = user_id.user_id;

      // Buscar usuario por documento
      const userResult = await client.query(
        'SELECT id FROM users WHERE documento = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.log(`Usuario con documento ${userId} no encontrado`);
        continue;
      }

      const usuarioId = userResult.rows[0].id;
      const fechaEvento = moment(server_datetime).startOf('day').format('YYYY-MM-DD');
      const horaEvento = moment(server_datetime).tz('UTC').format('HH:mm:ss');

      // Buscar u crear oficina
      let oficinaResult = await client.query(
        'SELECT id FROM oficinas WHERE fecha = $1',
        [fechaEvento]
      );

      let oficinaId;
      if (oficinaResult.rows.length === 0) {
        const newOficinaResult = await client.query(
          'INSERT INTO oficinas (fecha, asientos_disponibles) VALUES ($1, $2) RETURNING id',
          [fechaEvento, 80]
        );
        oficinaId = newOficinaResult.rows[0].id;
      } else {
        oficinaId = oficinaResult.rows[0].id;
      }

      // Buscar reserva existente
      const reservaResult = await client.query(
        `SELECT id, hora_llegada, hora_salida 
         FROM reservas 
         WHERE user_id = $1 
         AND oficina_id = $2 
         AND fecha_reserva::date = $3::date`,
        [usuarioId, oficinaId, fechaEvento]
      );

      if (reservaResult.rows.length > 0) {
        // Actualizar reserva existente
        const reserva = reservaResult.rows[0];
        let horaLlegada = reserva.hora_llegada || [];
        let horaSalida = reserva.hora_salida || [];

        if (device_id.name === "Entrada" && !horaLlegada.includes(horaEvento)) {
          horaLlegada.push(horaEvento);
          eventosEntradaProcesados++;
        } else if (device_id.name === "Salida" && !horaSalida.includes(horaEvento)) {
          horaSalida.push(horaEvento);
          eventosSalidaProcesados++;
        }

        await client.query(
          'UPDATE reservas SET hora_llegada = $1, hora_salida = $2 WHERE id = $3',
          [horaLlegada, horaSalida, reserva.id]
        );
      } else {
        // Crear nueva reserva
        const horaLlegada = device_id.name === "Entrada" ? [horaEvento] : [];
        const horaSalida = device_id.name === "Salida" ? [horaEvento] : [];

        await client.query(
          `INSERT INTO reservas 
           (user_id, oficina_id, fecha_reserva, hora_llegada, hora_salida) 
           VALUES ($1, $2, $3, $4, $5)`,
          [usuarioId, oficinaId, fechaEvento, horaLlegada, horaSalida]
        );

        if (device_id.name === "Entrada") eventosEntradaProcesados++;
        if (device_id.name === "Salida") eventosSalidaProcesados++;
      }
    }

    await client.query('COMMIT');

    console.log(`Eventos de entrada procesados: ${eventosEntradaProcesados}`);
    console.log(`Eventos de salida procesados: ${eventosSalidaProcesados}`);

    res.status(200).json({ message: "Eventos procesados exitosamente" });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al procesar eventos:", error);
    res.status(500).json({ message: "Error al procesar eventos" });
  } finally {
    client.release();
  }
};

// Obtener reservas por rango de fechas
export const getReservasPorRangoDeFechas = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal } = req.query;

    const fechaInicio = moment(fechaInicial).format("YYYY-MM-DD");
    const fechaFin = moment(fechaFinal)
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    const result = await pool.query(
      `
      SELECT 
        o.id AS oficina_id,
        o.fecha,
        o.asientos_disponibles,
        r.fecha_reserva,
        r.hora_salida,
        r.hora_llegada,
        r.numero_silla AS asiento,
        u.nombres,
        u.apellidos,
        u.documento,
        COALESCE(array_agg(DISTINCT ro.nombre), '{}') AS roles
      FROM reservas r
      JOIN oficinas o ON r.oficina_id = o.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles ro ON ro.id = ur.role_id
      WHERE o.fecha >= $1 
        AND o.fecha <= $2
      GROUP BY
        o.id,
        o.fecha,
        o.asientos_disponibles,
        r.fecha_reserva,
        r.hora_salida,
        r.hora_llegada,
        r.numero_silla,
        u.nombres,
        u.apellidos,
        u.documento
      ORDER BY o.fecha, r.fecha_reserva
      `,
      [fechaInicio, fechaFin]
    );

    const reservasConInfoUsuario = result.rows.map(row => ({
      _id: row.oficina_id,
      fecha: row.fecha,
      asientosDisponibles: row.asientos_disponibles,
      usuario: {
        nombres: row.nombres,
        apellidos: row.apellidos,
        documento: row.documento,
        roles: row.roles // 👈 AQUÍ VAN LOS ROLES
      },
      fechaReserva: row.fecha_reserva,
      horaSalida: row.hora_salida || [],
      horaLlegada: row.hora_llegada || [],
      asiento: row.asiento
    }));

    res.json(reservasConInfoUsuario);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las reservas." });
  }
};


// Obtener reservas por puesto
export const getReservasPorPuestos = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal, numeroSilla } = req.query;

    if (!fechaInicial || !fechaFinal || !numeroSilla) {
      return res.status(400).json({
        error: "Se requieren fechaInicial, fechaFinal y numeroSilla"
      });
    }

    const fechaInicio = moment(fechaInicial).format('YYYY-MM-DD');
    const fechaFin = moment(fechaFinal).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const result = await pool.query(
      `SELECT 
        r.fecha_reserva,
        r.hora_llegada,
        r.hora_salida,
        u.nombres,
        u.apellidos
       FROM reservas r
       JOIN oficinas o ON r.oficina_id = o.id
       JOIN users u ON r.user_id = u.id
       WHERE o.fecha >= $1 
       AND o.fecha <= $2 
       AND r.numero_silla = $3
       ORDER BY r.fecha_reserva`,
      [fechaInicio, fechaFin, parseInt(numeroSilla)]
    );

    const resultados = result.rows.map(row => ({
      fechaReserva: row.fecha_reserva,
      horaLlegada: row.hora_llegada || [],
      horaSalida: row.hora_salida || [],
      nombres: row.nombres,
      apellido: row.apellidos
    }));

    res.json(resultados);

  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({
      error: "Error al obtener las reservas.",
      details: error.message
    });
  }
};

// Eliminar una reserva
export const deleteReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { userId, fechaReserva } = req.params; // userId aquí en realidad es el ID de la reserva

    if (!fechaReserva || !moment(fechaReserva, "YYYY-MM-DD", true).isValid()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Datos de usuario o fecha de reserva inválidos."
      });
    }

    const formattedFechaReserva = moment(fechaReserva).startOf("day").format('YYYY-MM-DD');
    const reservaResult = await client.query(
      `SELECT r.*, o.id as oficina_id 
       FROM reservas r 
       JOIN oficinas o ON r.oficina_id = o.id 
       WHERE r.id = $1 
       AND r.fecha_reserva::date = $2::date`,
      [userId, formattedFechaReserva]
    );

    if (reservaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: "Reserva no encontrada."
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
    return res.status(200).json({ message: "Reserva eliminada exitosamente." });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la reserva." });
  } finally {
    client.release();
  }
};

// Obtener reservas de visitantes por rango de fechas
export const getReservasVisitanteByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;

    const fechaInicio = moment(fecha).startOf("day").toDate();
    const fechaFin = moment(fecha).endOf("day").toDate();

    const result = await pool.query(
      `
      SELECT 
        rv.id AS reserva_id,
        o.id AS oficina_id,
        o.fecha,
        o.asientos_disponibles,
        rv.fecha_reserva,
        rv.visitante_responsable_mobilize,
        rv.visitante_motivo,
        rv.visitante_acudiente,
        rv.visitante_tipo_acudiente,
        rv.visitante_numero_acudiente,
        v.id AS visitante_id,
        v.tipo_documento,
        v.documento,
        v.nombres,
        v.apellidos,
        v.sangre,
        v.telefono,
        v.direccion,
        v.eps,
        v.arl,
        v.enfermedades,
        v.alergias
      FROM reservas rv
      INNER JOIN oficinas o ON rv.oficina_id = o.id
      INNER JOIN visitantes v ON rv.visitante_id = v.id
      WHERE rv.fecha_reserva >= $1
        AND rv.fecha_reserva <= $2
        AND rv.visitante_id IS NOT NULL
        AND rv.tipo = 'visitante'
      ORDER BY rv.fecha_reserva
      `,
      [fechaInicio, fechaFin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No se encontraron reservaciones para ${moment(fecha).format(
          "DD [de] MMMM [del] YYYY"
        )}.`,
      });
    }

    // Transformar los datos al formato esperado por el frontend
    const reservas = result.rows.map(row => ({
      id: row.reserva_id,
      _id: row.oficina_id,
      visitante_id: row.visitante_id,
      fecha: row.fecha,
      asientosDisponibles: row.asientos_disponibles,
      nombres: row.nombres,
      apellidos: row.apellidos,
      sangre: row.sangre,
      telefono: row.telefono,
      direccion: row.direccion,
      eps: row.eps,
      arl: row.arl,
      enfermedades: row.enfermedades || [],
      alergias: row.alergias || [],
      fechas_reserva: [{
        fechaReserva: row.fecha_reserva,
        responsable_mobilize: row.visitante_responsable_mobilize,
        motivo: row.visitante_motivo,
        acudiente: row.visitante_acudiente,
        tipo_acudiente: row.visitante_tipo_acudiente,
        numero_acudiente: row.visitante_numero_acudiente
      }]
    }));

    return res.status(200).json({ data: { reservas } });

  } catch (error) {
    console.error("Error en getReservasVisitanteByFecha:", error);
    return res.status(500).json({ message: "Error al obtener las reservas." });
  }
};

export const getReservasVisitantePorRangoDeFechas = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal } = req.query;

    const fechaInicio = moment(fechaInicial).format('YYYY-MM-DD');
    const fechaFin = moment(fechaFinal).format('YYYY-MM-DD');

    const result = await pool.query(
      `SELECT 
        rv.id AS reserva_id,
        o.id as oficina_id,
        o.fecha,
        o.asientos_disponibles,
        rv.fecha_reserva,
        rv.visitante_responsable_mobilize,
        rv.visitante_motivo,
        rv.visitante_acudiente,
        rv.visitante_tipo_acudiente,
        rv.visitante_numero_acudiente,
        v.id AS visitante_id,
        v.tipo_documento,
        v.documento,
        v.nombres,
        v.apellidos,
        v.sangre,
        v.telefono,
        v.direccion,
        v.eps,
        v.arl,
        v.enfermedades,
        v.alergias
       FROM reservas rv
       JOIN oficinas o ON rv.oficina_id = o.id
       JOIN visitantes v ON rv.visitante_id = v.id
       WHERE rv.fecha_reserva >= $1 
         AND rv.fecha_reserva <= $2
         AND rv.visitante_id IS NOT NULL
         AND rv.tipo = 'visitante'
       ORDER BY rv.fecha_reserva`,
      [fechaInicio, fechaFin]
    );

    const reservasConInfoVisitante = result.rows.map(row => ({
      id: row.reserva_id,
      _id: row.oficina_id,
      fecha: row.fecha,
      asientosDisponibles: row.asientos_disponibles,
      nombres: row.nombres,
      apellidos: row.apellidos,
      sangre: row.sangre,
      telefono: row.telefono,
      direccion: row.direccion,
      eps: row.eps,
      arl: row.arl,
      enfermedades: row.enfermedades || [],
      alergias: row.alergias || [],
      fechas_reserva: [{
        fechaReserva: row.fecha_reserva,
        responsable_mobilize: row.visitante_responsable_mobilize,
        motivo: row.visitante_motivo,
        acudiente: row.visitante_acudiente,
        tipo_acudiente: row.visitante_tipo_acudiente,
        numero_acudiente: row.visitante_numero_acudiente
      }]
    }));

    res.json(reservasConInfoVisitante);

  } catch (error) {
    console.error("Error en getReservasVisitantePorRangoDeFechas:", error);
    res.status(500).json({
      error: "Error al obtener las reservas de visitantes."
    });
  }
};
export const consultarAsiento = async (numeroSilla, fechaEspecifica) => {
  const client = await pool.connect();
  try {
    const fechaInicio = moment(fechaEspecifica).startOf('day').format('YYYY-MM-DD');
    const fechaFin = moment(fechaEspecifica).endOf('day').format('YYYY-MM-DD');

    // Consulta: buscar si hay reservas para esa silla en la fecha
    const query = `
      SELECT r.*, u.nombres, u.apellidos, u.documento
      FROM reservas r
      JOIN users u ON r.user_id = u.id
      WHERE r.numero_silla = $1
        AND r.fecha_reserva::date BETWEEN $2::date AND $3::date
      LIMIT 1
    `;

    const { rows } = await client.query(query, [numeroSilla, fechaInicio, fechaFin]);

    if (rows.length > 0) {
      const reservaEncontrada = rows[0];
      return {
        usuario: {
          nombres: reservaEncontrada.nombres,
          apellidos: reservaEncontrada.apellidos,
          documento: reservaEncontrada.documento,
        },
        reserva: {
          id: reservaEncontrada.id,
          numeroSilla: reservaEncontrada.numero_silla,
          fechaReserva: reservaEncontrada.fecha_reserva,
          tipo: reservaEncontrada.tipo,
        },
      };
    }

    return null;

  } catch (error) {
    console.error("Error al consultar asiento:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const reservaMasiva = async (req, res) => {
  const client = await pool.connect();

  try {
    const { jsonData } = req.body;

    if (!jsonData) {
      return res.status(400).json({ error: "JSON data is required." });
    }

    const userData = filterData(jsonData);

    await client.query("BEGIN");

    for (const userDatum of userData) {
      const { documento, fechaReserva, horaLlegada, horaSalida } = userDatum;

      const fechaReservaFormatted = moment(fechaReserva)
        .startOf("day")
        .toDate();

      // 1️⃣ Buscar usuario
      const userResult = await client.query(
        `SELECT id FROM users WHERE documento = $1`,
        [documento]
      );

      if (userResult.rows.length === 0) continue;

      const userId = userResult.rows[0].id;

      // 2️⃣ Eliminar reservas existentes del mismo día
      await client.query(
        `
        DELETE FROM reservas
        WHERE user_id = $1
          AND fecha_reserva::date = $2::date
        `,
        [userId, fechaReservaFormatted]
      );

      // 3️⃣ Buscar o crear oficina
      const oficinaResult = await client.query(
        `
        SELECT id FROM oficinas
        WHERE fecha::date = $1::date
        `,
        [fechaReservaFormatted]
      );

      let oficinaId;

      if (oficinaResult.rows.length === 0) {
        const newOficina = await client.query(
          `
          INSERT INTO oficinas (fecha, asientos_disponibles)
          VALUES ($1, 80)
          RETURNING id
          `,
          [fechaReservaFormatted]
        );
        oficinaId = newOficina.rows[0].id;
      } else {
        oficinaId = oficinaResult.rows[0].id;
      }

      // 4️⃣ Eliminar reservas duplicadas del usuario en la oficina
      await client.query(
        `
        DELETE FROM reservas
        WHERE oficina_id = $1
          AND user_id = $2
          AND fecha_reserva::date = $3::date
        `,
        [oficinaId, userId, fechaReservaFormatted]
      );

      // 5️⃣ Insertar nueva reserva
      await client.query(
        `
        INSERT INTO reservas (
          oficina_id,
          user_id,
          fecha_reserva,
          hora_llegada,
          hora_salida
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          oficinaId,
          userId,
          fechaReservaFormatted,
          horaLlegada,
          horaSalida
        ]
      );

      // 6️⃣ Recalcular asientos disponibles
      const countResult = await client.query(
        `
        SELECT COUNT(*) FROM reservas
        WHERE oficina_id = $1
        `,
        [oficinaId]
      );

      const reservasCount = Number(countResult.rows[0].count);

      await client.query(
        `
        UPDATE oficinas
        SET asientos_disponibles = 80 - $1
        WHERE id = $2
        `,
        [reservasCount, oficinaId]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "La reserva y la hora fueron asignadas correctamente."
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ error: "Error processing JSON data." });
  } finally {
    client.release();
  }

};
export const cambiarEstadoReservaPorTardanza = cron.schedule(
  cronExpressionTardanza,
  async () => {
    console.log("Ejecutando tarea programada: cambiarEstadoReservaPorTardanza");

    await pool.query(`
      UPDATE reservas r
      SET estado = 'inactivo_por_tardanza'
      WHERE r.fecha_reserva::date = CURRENT_DATE
        AND r.tipo = 'usuario'
        AND (r.hora_llegada IS NULL OR array_length(r.hora_llegada, 1) = 0)
        AND r.estado = 'activo'
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
    `);
  },
  {
    timezone: "America/Bogota",
  }
);


export const cambiarEstadoReservaPorAusencia = cron.schedule(
  cronExpressionSalida,
  async () => {
    console.log("Ejecutando tarea programada: cambiarEstadoReservaPorAusencia");

    await pool.query(`
      UPDATE reservas r
      SET estado = 'inactivo_por_ausencia'
      WHERE r.tipo = 'usuario'
        AND r.fecha_reserva = CURRENT_DATE
        AND (r.hora_llegada IS NULL OR array_length(r.hora_llegada, 1) = 0)
        AND r.estado NOT IN ('activo', 'programado')
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
    `);
  },
  {
    timezone: "America/Bogota"
  }
);
export const eliminarReservasTIporTardanza = cron.schedule(
  cronExpressionTardanzaTIN,
  async () => {

    await pool.query(`
      DELETE FROM reservas r
      WHERE r.fecha_reserva::date = CURRENT_DATE
        AND (r.hora_llegada IS NULL OR array_length(r.hora_llegada, 1) = 0)
        AND EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles ro ON ro.id = ur.role_id
          WHERE ur.user_id = r.user_id
            AND ro.nombre = 'TI'
        )
    `);
  },
  {
    timezone: "America/Bogota"
  }
);
export const finalizarReservasPorSalida = cron.schedule(
  cronExpressionSalida,
  async () => {
    console.log("Ejecutando tarea programada: completarReservasPorSalida");

    await pool.query(`
      UPDATE reservas r
      SET estado = 'finalizado'
      WHERE r.tipo = 'usuario'
        AND r.fecha_reserva::date = CURRENT_DATE
        AND r.estado = 'activo'
    `);
  },
  {
    timezone: "America/Bogota",
  }
);



