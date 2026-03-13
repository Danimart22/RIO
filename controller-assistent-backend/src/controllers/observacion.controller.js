import pool from "../database.js";
import { logger } from "../logger/logger.js";
import { sendMail } from "../libs/SESMailer.js";

export const createObservacion = async (req, res) => {
  const client = await pool.connect();
  logger.info(
    {
      userId: req.userId,
      asiento: req.body?.asientoReportado,
      fecha: req.body?.fecha,
    },
    "Inicio creación de observación"
  );
  try {
    let {
      fecha,
      asientoReportado,
      observaciones,
      objetos,
    } = req.body;

    await client.query('BEGIN');
    logger.debug("Transacción iniciada (createObservacion)");
    // Validación de campos requeridos
    if (!fecha || !asientoReportado || !objetos || !Array.isArray(objetos) || objetos.length === 0) {
      logger.warn(
        { userId: req.userId },
        "Campos requeridos faltantes en creación de observación"
      );
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Todos los campos requeridos deben ser proporcionados.",
      });
    }

    // Validación de objetos
    const validObjetos = [
      "Pantalla", "Teclado", "Mouse", "Descansa pies", "Silla",
      "Hub adaptador USB", "Cable de video HDMI", "Otros",
    ];

    const invalidObjetos = objetos.filter(obj => !validObjetos.includes(obj.objeto));
    if (invalidObjetos.length > 0) {
      logger.warn(
        {
          userId: req.userId,
          invalidos: invalidObjetos.map(o => o.objeto),
        },
        "Objetos inválidos en observación"
      );
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Los siguientes objetos no son válidos: ${invalidObjetos.map(o => o.objeto).join(", ")}`
      });
    }

    // Obtener el usuario reportante
    const usuarioReportanteId = req.userId;
    const userQuery = `
      SELECT id, nombres, apellidos, correo 
      FROM users 
      WHERE id = $1
    `;
    const userResult = await client.query(userQuery, [usuarioReportanteId]);

    if (userResult.rows.length === 0) {
      logger.error(
        { userId: usuarioReportanteId },
        "Usuario reportante no encontrado"
      );
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const usuarioReportante = userResult.rows[0];

    // Agregar estado 'activo' a cada objeto si no lo tiene
    const objetosConEstado = objetos.map(obj => ({
      ...obj,
      estado: obj.estado || 'activo'
    }));

    // Crear nueva observación con objetos en JSONB
    const insertObservacionQuery = `
      INSERT INTO observaciones (
        fecha, asiento_reportado, observaciones, objetos, user_id, 
        nombre_reportante
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const observacionResult = await client.query(insertObservacionQuery, [
      fecha,
      asientoReportado,
      observaciones,
      JSON.stringify(objetosConEstado),
      usuarioReportante.id,
      `${usuarioReportante.nombres} ${usuarioReportante.apellidos}`
    ]);

    const observacionId = observacionResult.rows[0].id;

    await client.query('COMMIT');
    logger.info(
      {
        observacionId,
        userId: usuarioReportante.id,
        asiento: asientoReportado,
        totalObjetos: objetosConEstado.length,
      },
      "Observación creada exitosamente"
    );
    // Función para enviar correos
    const enviaCorreo = async (to, subject, text) => {
      try {
        await sendMail(to, subject, text);
        console.log(`Correo enviado a ${to} con el asunto: ${subject}`);
        logger.info({ to, subject }, "Correo enviado");
      } catch (error) {
        logger.error(
          { err: error, to, subject },
          "Error enviando correo"
        );
        console.error(`Error al enviar correo a ${to}:`, error);
      }
    };

    // Correo de confirmación
    await enviaCorreo(
      usuarioReportante.correo,
      "Nuevo reporte de objeto",
      `Se ha creado un nuevo reporte para el asiento ${asientoReportado}.`
    );

    // Clasificar objetos
    const electronicos = ["Pantalla", "Teclado", "Mouse", "Hub adaptador USB", "Cable de video HDMI"];
    const mobiliario = ["Descansa pies", "Silla", "Otros"];

    let objFaltantes = objetos.filter(item => item.tipo === "faltante");
    let objDanados = objetos.filter(item => item.tipo === "dañado");

    let elementosElectronicosFaltantes = objFaltantes.filter(item => electronicos.includes(item.objeto));
    let elementosElectronicosDanados = objDanados.filter(item => electronicos.includes(item.objeto));
    let elementosMobiliarioFaltantes = objFaltantes.filter(item => mobiliario.includes(item.objeto));
    let elementosMobiliarioDanados = objDanados.filter(item => mobiliario.includes(item.objeto));
    logger.debug(
      {
        electronicosFaltantes: elementosElectronicosFaltantes.length,
        electronicosDanados: elementosElectronicosDanados.length,
        mobiliarioFaltantes: elementosMobiliarioFaltantes.length,
        mobiliarioDanados: elementosMobiliarioDanados.length,
      },
      "Clasificación de objetos completada"
    );
    // Correo para electrónicos
    if (elementosElectronicosFaltantes.length > 0 || elementosElectronicosDanados.length > 0) {
      const detallesElectronicos = [];
      if (elementosElectronicosFaltantes.length > 0) {
        detallesElectronicos.push(`Faltantes: ${elementosElectronicosFaltantes.map(o => o.objeto).join(", ")}`);
      }
      if (elementosElectronicosDanados.length > 0) {
        detallesElectronicos.push(`Dañados: ${elementosElectronicosDanados.map(o => o.objeto).join(", ")}`);
      }
      await enviaCorreo(
        "soporte@rci-colombia.com",
        "Reporte de equipo electrónico",
        `Se han reportado elementos en el asiento ${asientoReportado}: ${detallesElectronicos.join("; ")}`
      );
    }

    // Correo para mobiliario
    if (elementosMobiliarioFaltantes.length > 0 || elementosMobiliarioDanados.length > 0) {
      const detallesMobiliario = [];
      if (elementosMobiliarioFaltantes.length > 0) {
        detallesMobiliario.push(`Faltantes: ${elementosMobiliarioFaltantes.map(o => o.objeto).join(", ")}`);
      }
      if (elementosMobiliarioDanados.length > 0) {
        detallesMobiliario.push(`Dañados: ${elementosMobiliarioDanados.map(o => o.objeto).join(", ")}`);
      }
      await enviaCorreo(
        "natalia.echavarria@mobilize-fs.com , nina.mejia@mobilize-fs.com",
        "Reporte de mobiliario",
        `Se han reportado elementos en el asiento ${asientoReportado}: ${detallesMobiliario.join("; ")}`
      );
    }

    res.status(201).json({
      message: "Reporte creado exitosamente",
      data: { id: observacionId }
    });
    logger.info(
      { observacionId },
      "Transacción confirmada (createObservacion)"
    );

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(
      {
        err: error,
        userId: req.userId,
      },
      "Error creando observación"
    );
    console.error(error);
    res.status(500).json({ message: "Error al crear el reporte" });
  } finally {
    client.release();
  }
};

// Resolver observación
export const resolverObservacion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id, obj } = req.params;
    logger.info(
      { observacionId: id, objeto: obj },
      "Inicio resolución de observación"
    );

    await client.query('BEGIN');
    logger.warn(
      { observacionId: id },
      "Observación no encontrada"
    );
    // Buscar la observación
    const observacionQuery = `
      SELECT 
        o.id, o.asiento_reportado, o.nombre_reportante, o.objetos,
        u.correo
      FROM observaciones o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const observacionResult = await client.query(observacionQuery, [id]);

    if (observacionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Observación no encontrada" });
    }

    const observacion = observacionResult.rows[0];
    const objetos = observacion.objetos || [];

    // Buscar y actualizar el objeto en el array JSONB
    const objetoIndex = objetos.findIndex(o => o.objeto === obj && o.estado === 'activo');

    if (objetoIndex === -1) {
      logger.warn(
        { observacionId: id, objeto: obj },
        "Objeto no encontrado o ya resuelto"
      );
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: `El objeto ${obj} no fue encontrado o ya está resuelto`
      });
    }

    // Actualizar el estado del objeto
    objetos[objetoIndex].estado = 'resuelto';

    // Actualizar la observación con el nuevo array de objetos
    const updateObservacionQuery = `
      UPDATE observaciones
      SET objetos = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await client.query(updateObservacionQuery, [JSON.stringify(objetos), id]);

    await client.query('COMMIT');
    logger.info(
      { observacionId: id, objeto: obj },
      "Objeto marcado como resuelto"
    );
    // Enviar correo
    await sendMail(
      observacion.correo,
      "Observación resuelta",
      `Hola, ${observacion.nombre_reportante}\n\nTu reporte con el asiento ${observacion.asiento_reportado} ha sido resuelto.\nGracias por reportarlo.`
    );
    logger.info(
      { observacionId: id, to: observacion.correo },
      "Correo de resolución enviado"
    );
    res.status(200).json({
      message: "Estado de la observación actualizado a 'resuelto'",
    });

  } catch (error) {
    logger.error(
      {
        err: error,
        observacionId: id,
      },
      "Error resolviendo observación"
    );
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  } finally {
    client.release();
  }
};

// Obtener todos los reportes
export const getAllReport = async (req, res) => {
  logger.info("Solicitud para obtener todos los reportes");
  try {
    const query = `
      SELECT
        id,
        fecha,
        asiento_reportado,
        observaciones,
        estado,
        tipo,
        user_id,
        nombre_reportante,
        COALESCE(objetos, '[]'::jsonb) AS objetos
      FROM observaciones
      ORDER BY fecha DESC
    `;

    const result = await pool.query(query);
    logger.info(
      { total: result.rows.length },
      "Reportes obtenidos"
    );
    if (result.rows.length === 0) {
      logger.warn("No se encontraron reportes");
      return res.status(404).json({
        message: "No se encontraron observaciones."
      });
    }

    res.status(200).json({
      message: "Observaciones obtenidas exitosamente",
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las observaciones" });
  }
};


// Obtener observaciones activas
export const getObservacionesActivas = async (req, res) => {
  logger.info("Solicitud de observaciones activas");
  try {
    const query = `
      SELECT 
        o.id,
        o.fecha,
        o.asiento_reportado,
        o.observaciones,
        COALESCE(
          jsonb_agg(objeto) FILTER (WHERE objeto->>'estado' = 'activo'),
          '[]'
        ) AS objetos,
        o.estado,
        o.tipo,
        o.user_id,
        o.nombre_reportante
      FROM observaciones o,
      LATERAL jsonb_array_elements(o.objetos) AS objeto
      WHERE objeto->>'estado' = 'activo'
      GROUP BY o.id, o.fecha, o.asiento_reportado, o.observaciones, o.estado, o.tipo, o.user_id, o.nombre_reportante
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron observaciones activas."
      });
    }

    res.status(200).json({
      message: "Observaciones activas obtenidas exitosamente",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener las observaciones activas"
    });
  }
};

// Buscar por asiento
export const findBySeat = async (req, res) => {
  try {
    const { silla } = req.params;

    const query = `
      SELECT 
        o.id,
        o.fecha,
        o.asiento_reportado,
        o.observaciones,
        o.estado,
        o.tipo,
        o.user_id,
        o.nombre_reportante,
        COALESCE(
          (SELECT jsonb_agg(obj)
           FROM jsonb_array_elements(o.objetos) AS obj
           WHERE obj->>'estado' = 'activo'),
          '[]'::jsonb
        ) AS objetos
      FROM observaciones o
      WHERE o.asiento_reportado = $1
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(o.objetos) AS obj
          WHERE obj->>'estado' = 'activo'
        )
    `;
    const result = await pool.query(query, [silla]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron observaciones para el asiento indicado."
      });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al buscar las observaciones." });
  }
};

// Obtener observaciones por rango
export const getObservacionesPorRango = async (req, res) => {
  const { fechaIni, fechaFinal } = req.params;

  try {
    if (!fechaIni || !fechaFinal) {
      return res.status(400).json({ message: "Las fechas inicial y final son obligatorias." });
    }

    const fechaRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
    if (!fechaRegex.test(fechaIni) || !fechaRegex.test(fechaFinal)) {
      return res.status(400).json({ message: "Formato de fechas no válido. Debe ser YYYY-MM-DD." });
    }

    const query = `
      SELECT
        id,
        fecha,
        asiento_reportado,
        observaciones,
        COALESCE(objetos, '[]'::jsonb) AS objetos,
        estado,
        tipo,
        user_id,
        nombre_reportante
      FROM observaciones
      WHERE fecha BETWEEN $1 AND $2
      ORDER BY fecha DESC
    `;

    const result = await pool.query(query, [fechaIni, fechaFinal]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron observaciones en el rango indicado." });
    }

    res.status(200).json({
      message: "Observaciones obtenidas correctamente",
      data: result.rows
    });

  } catch (error) {
    console.error("Error al obtener observaciones por rango:", error);
    res.status(500).json({ message: "Error al obtener las observaciones" });
  }
};