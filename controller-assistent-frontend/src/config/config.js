import { getENV } from './env';

export const config = {
    RioBackendUrl: () => getENV().RIO_BACKEND_URL,
    HoraLimiteReserva: () => getENV().HORA_LIMITE_RESERVA,
    // HoraLimiteLlegadaReserva: () => getENV().HORA_LIMITE_LLEGADA_RESERVA,
}