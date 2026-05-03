const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Import routes
const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const foodStockRoutes   = require('./routes/foodStock');
const medicalStockRoutes = require('./routes/medicalStock');
const transportRoutes   = require('./routes/transport');
const app = express();

const ALLOWED_ORIGINS = [
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^http:\/\/(192\.168|10\.)\d+\.\d+\.\d+:\d+$/,
  /\.vercel\.app$/,
];
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(r =>
      typeof r === 'string' ? r === origin : r.test(origin)
    );
    allowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('/(.*)', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/food-stock',    foodStockRoutes);
app.use('/api/medical-stock', medicalStockRoutes);
app.use('/api/transport',     transportRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API Association Al Amal' });
});

// MongoDB — cached connection (serverless safe)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
};

// Serverless export (Vercel) + local server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Serveur démarré sur le port ${PORT}`)
    ))
    .catch(err => console.error('❌ MongoDB:', err.message));
}

// Vercel serverless handler
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
