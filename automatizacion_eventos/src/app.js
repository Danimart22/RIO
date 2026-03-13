import express from 'express';
import { login, searchEvents } from './controllers/login.js';
import { PORT } from './config.js';
import morgan from 'morgan';
import healthRoutes from './health.js';

const app = express();
app.use(morgan('dev', {
  skip: (req) => req.url === '/health'
}));
app.use(healthRoutes);

app.get('/login', async (req, res) => {
  try {
    const bsSessionId = await login();
    res.send(`Login successful, bs-session-id: ${bsSessionId}`);
  } catch (error) {
    res.status(500).send(`Login failed: ${error.message}`);
  }
});

app.get('/searchEvents', async (req, res) => {
  try {
    const bsSessionId = await login();
    const events = await searchEvents(bsSessionId);
    res.json(events);
  } catch (error) {
    res.status(500).send(`Error searching events: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;