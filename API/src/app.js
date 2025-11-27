require('dotenv').config();

const connectDB = require('./config/database');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const busquedaRoutes = require('./routes/busqueda.routes');
const csvRoutes = require('./routes/csv.routes');
const authRoutes = require('./routes/auth.routes');
const searchHistoryRoutes = require('./routes/searchHistory.routes');

const app = express();

connectDB();

const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
app.use(express.json());
app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));

// Rutas
app.use('/api/buscar', busquedaRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', searchHistoryRoutes);

app.get('/', (_req, res) => {
    res.send('API de Búsqueda de ADN con KMP')
})

module.exports = app;
