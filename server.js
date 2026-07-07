require('dotenv').config();

const app = require('./app');
const connectDB = require('./app/config/db');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function start() {
  try {
    validateEnv();
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(`Gaza E Meter running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
