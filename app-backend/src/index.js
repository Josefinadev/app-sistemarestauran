const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors({
  origin: true, // Permitir cualquier origin (necesario para React Native mobile)
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging middleware ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Routes ──
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const mesasRoutes = require('./routes/mesas');
const categoriasRoutes = require('./routes/categorias');
const restauranteRoutes = require('./routes/restaurante');
const usuariosRoutes = require('./routes/usuarios');
const webRoutes = require('./routes/web');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const pagosRoutes = require('./routes/pagos');

app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/restaurante', restauranteRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/web', webRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El Mijano API v1',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Error interno del servidor',
  });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`\n🍷 El Mijano API corriendo en http://localhost:${PORT}\n`);
});