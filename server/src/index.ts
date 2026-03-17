import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { meetingRoutes } from './routes/meetings.js';
import { contactRoutes } from './routes/contacts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/meetings', meetingRoutes);
app.use('/api/contacts', contactRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
