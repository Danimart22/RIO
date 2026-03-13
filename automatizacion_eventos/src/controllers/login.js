import axios from 'axios';
import https from 'https';
import cron from 'node-cron';
import pool from '../database.js';
import moment from 'moment-timezone';
import fs from 'fs';
import { LOGIN_URL, LOGIN_ID, LOGIN_PASSWORD, DEVICE_IDS, CRON_SCHEDULE } from '../config';
import { logger } from '../logger';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function importReservaLocal(events) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventos = events.EventCollection.rows;
    let eventosEntradaProcesados = 0;
    let eventosSalidaProcesados = 0;

    for (const evento of eventos) {
      const { user_id, server_datetime, device_id } = evento;
      const userId = user_id.user_id;

      const userResult = await client.query(
        'SELECT id FROM users WHERE documento = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        logger.warn({ documento: userId }, 'Usuario no encontrado, omitiendo evento');
        continue;
      }

      const usuarioId = userResult.rows[0].id;
      const fechaEvento = moment(server_datetime).startOf('day').format('YYYY-MM-DD');
      const horaEvento = moment(server_datetime).tz('UTC').format('HH:mm:ss');

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
        logger.debug({ fechaEvento, oficinaId }, 'Oficina creada');
      } else {
        oficinaId = oficinaResult.rows[0].id;
      }

      const reservaResult = await client.query(
        `SELECT id, hora_llegada, hora_salida 
         FROM reservas 
         WHERE user_id = $1 AND oficina_id = $2 AND fecha_reserva::date = $3::date`,
        [usuarioId, oficinaId, fechaEvento]
      );

      if (reservaResult.rows.length > 0) {
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
        const horaLlegada = device_id.name === "Entrada" ? [horaEvento] : [];
        const horaSalida = device_id.name === "Salida" ? [horaEvento] : [];

        await client.query(
          `INSERT INTO reservas (user_id, oficina_id, fecha_reserva, hora_llegada, hora_salida) 
           VALUES ($1, $2, $3, $4, $5)`,
          [usuarioId, oficinaId, fechaEvento, horaLlegada, horaSalida]
        );

        if (device_id.name === "Entrada") eventosEntradaProcesados++;
        if (device_id.name === "Salida") eventosSalidaProcesados++;
      }
    }

    await client.query('COMMIT');
    logger.info({ eventosEntradaProcesados, eventosSalidaProcesados }, 'Reservas importadas localmente');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error.message }, 'Error en importReservaLocal, ROLLBACK ejecutado');
    throw error;
  } finally {
    client.release();
  }
}

export async function login() {
  logger.info('Iniciando login...');
  try {
    logger.debug({ url: `${LOGIN_URL}/api/login`, login_id: LOGIN_ID }, 'Enviando solicitud de login a Byostar');

    const response = await axios.post(`${LOGIN_URL}/api/login`, {
      User: {
        login_id: LOGIN_ID,
        password: LOGIN_PASSWORD
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: agent
    });

    const bsSessionId = response.headers['bs-session-id'];

    if (!bsSessionId) {
      logger.error('bs-session-id no encontrado en los headers de respuesta');
      throw new Error('bs-session-id not found in response headers');
    }

    logger.info({ bsSessionId }, 'Login exitoso en Byostar, bs-session-id obtenido');
    return bsSessionId;
  } catch (error) {
    logger.error({ err: error.message }, 'Error al hacer login');
    throw error;
  }
}

export async function searchEvents(bsSessionId) {
  logger.info('Iniciando búsqueda de eventos en Byostar...');
  try {
    const currentDate = new Date();
    const nextDayDate = new Date(currentDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    currentDate.setDate(nextDayDate.getDate() - 6);
    nextDayDate.setUTCHours(0, 0, 0, 0);

    logger.debug({ desde: currentDate.toISOString(), hasta: nextDayDate.toISOString(), dispositivos: DEVICE_IDS }, 'Rango de fechas y dispositivos para búsqueda');

    const requestBody = {
      Query: {
        limit: 2400,
        conditions: [
          { column: 'device_id.id', values: DEVICE_IDS },
          { column: 'datetime', operator: 3, values: [currentDate.toISOString(), nextDayDate.toISOString()] }
        ]
      }
    };

    logger.debug({ url: `${LOGIN_URL}/api/events/search` }, 'Enviando solicitud de búsqueda de eventos a Byostar');
    const response = await axios.post(`${LOGIN_URL}/api/events/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'bs-session-id': bsSessionId
      },
      httpsAgent: agent
    });

    const events = response.data;
    logger.info({ totalEventos: events?.length ?? 'desconocido' }, 'Eventos obtenidos correctamente desde Byostar');

    fs.writeFile('test.txt', JSON.stringify(events, null, 2), (err) => {
      if (err) logger.error({ err: err.message }, 'Error escribiendo archivo test.txt');
      else logger.debug('Archivo test.txt escrito correctamente');
    });

    await importReservaLocal(events);

    return events;
  } catch (error) {
    logger.error({ err: error.message }, 'Error al buscar o enviar eventos');
    throw error;
  }
}

async function main() {
  logger.info('=== Iniciando proceso principal ===');
  try {
    const bsSessionId = await login();
    await searchEvents(bsSessionId);
    logger.info('=== Proceso principal completado exitosamente ===');
  } catch (error) {
    logger.error({ err: error.message }, 'Error en el proceso principal');
  }
}

main();

cron.schedule(CRON_SCHEDULE, () => {
  logger.info({ schedule: CRON_SCHEDULE }, 'Ejecutando tarea programada por cron');
  main();
});