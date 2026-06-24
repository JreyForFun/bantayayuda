// server.js — Entry point
// Express app setup + mount all routes
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import beneficiaryRoutes from './routes/beneficiary.routes.js';
import programRoutes from './routes/program.routes.js';
import applicationRoutes from './routes/application.routes.js';
import distributionRoutes from './routes/distribution.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';

dotenv.config();
const app = express();
// Middleware
app.use(express.json());

app.use(express.static('public'));
// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
// Fallback: If a frontend page is requested directly, serve index.html or dashboard.html
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BantayAyuda Server running on http://localhost:${PORT}`);
});