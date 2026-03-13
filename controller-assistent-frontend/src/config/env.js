

/**
 * Función para obtener las variables de entorno en runtime.
 * - En producción (Docker): lee desde window.__ENV__
 * - En desarrollo local: usa process.env (variables de .env)
 */
export const getENV = () => {
    // Producción: si window.__ENV__ existe, úsalo
    if (typeof window !== 'undefined' && window.__ENV__) {
        return {
            RIO_BACKEND_URL: window.__ENV__.RIO_BACKEND_URL,
            HORA_LIMITE_RESERVA: window.__ENV__.HORA_LIMITE_RESERVA,
            // HORA_LIMITE_LLEGADA_RESERVA: window.__ENV__.HORA_LIMITE_LLEGADA_RESERVA,
        };
    }

    // Desarrollo local: usa process.env (de tu archivo .env)
    return {
        RIO_BACKEND_URL: process.env.REACT_APP_RIO_BACKEND_URL,
        HORA_LIMITE_RESERVA: process.env.REACT_APP_HORA_LIMITE_RESERVA,
        // HORA_LIMITE_RESERVA: process.env.REACT_APP_HORA_LIMITE_RESERVA,
        // HORA_LIMITE_LLEGADA_RESERVA: process.env.REACT_APP_HORA_LIMITE_LLEGADA_RESERVA,
    };
};