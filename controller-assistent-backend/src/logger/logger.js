import pino from "pino";

// Configuración de logger
export const logger = pino({
  level: "debug", // Nivel máximo por defecto 
  timestamp: pino.stdTimeFunctions.isoTime, // timestamps ISO legibles
});
