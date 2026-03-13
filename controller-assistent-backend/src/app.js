import express from "express";
import morgan from "morgan";
import visitantesRoutes from './routes/visitante.routes.js'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/user.routes.js'
import oficinaRoutes from './routes/assistance.routes.js'
import reemplazoRoutes from './routes/reemplazo.routes.js'
import observacionRoutes from "./routes/observacion.routes.js";
import helmet from "helmet";
import './database.js';
import cors from "cors";
import healthRoutes from './routes/health.routes.js'

const app = express()


app.set("port", process.env.PORT || 4000);
app.set("json spaces", 4);


//app.use(cors({origin: 'https://rio.rci-colombia.com'}));
app.use(cors({origin: process.env.RIO_FRONTEND_URL}));
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));
app.use(helmet());
app.use(express.json());
app.use(healthRoutes);
app.use(morgan('dev', {
  skip: (req) => req.url === '/health'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))



app.use('/api/visitantes', visitantesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/oficina', oficinaRoutes);
app.use('/api/reemplazo', reemplazoRoutes);
app.use('/api/observacion', observacionRoutes);

export default app;