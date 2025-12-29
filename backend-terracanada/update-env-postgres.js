#!/usr/bin/env node

/**
 * Script para actualizar .env con configuración PostgreSQL
 * Uso: node update-env-postgres.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

const newEnvContent = `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration - PostgreSQL
DB_HOST=epanel.salazargroup.cloud
DB_PORT=5433
DB_USER=admin
DB_PASSWORD=ag!Z:_dmgrgi4n1rg2r43
DB_NAME=terra_canada

# JWT Configuration
JWT_SECRET=cda6eec05704dae1f719377ad212c760879be1a33fb2754c3d37fb0bc06f22d8
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# API Documentation
API_TITLE=Terra Canada API
API_VERSION=1.0.0
API_DESCRIPTION=Backend API para Terra Canada Management System

# Logging
LOG_LEVEL=info

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
`;

try {
  fs.writeFileSync(envPath, newEnvContent, 'utf8');
  console.log('✅ Archivo .env actualizado con configuración PostgreSQL');
  console.log('\n📋 Configuración:');
  console.log('   DB_HOST: epanel.salazargroup.cloud');
  console.log('   DB_PORT: 5433');
  console.log('   DB_USER: admin');
  console.log('   DB_NAME: terra_canada');
  console.log('   JWT_SECRET: cda6eec05704dae1f719377ad212c760879be1a33fb2754c3d37fb0bc06f22d8');
  console.log('\n⏳ Reinicia el backend con: npm run dev\n');
} catch (error) {
  console.error('❌ Error actualizando .env:', error.message);
  process.exit(1);
}
