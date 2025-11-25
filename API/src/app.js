require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const busquedaRoutes = require('./routes/busqueda.routes');
const registroRoutes = require('./routes/registro.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));

// Rutas
app.use('/api/buscar', busquedaRoutes);
app.use('/api/secuencias', registroRoutes);

app.get('/', (_req, res) => {
    res.send('API de Búsqueda de ADN con KMP')
})

module.exports = app;