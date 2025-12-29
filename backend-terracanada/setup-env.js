#!/usr/bin/env node

/**
 * Script para crear el archivo .env desde .env.example
 * Uso: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

try {
  // Leer .env.example
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ Error: No se encontró .env.example');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Crear .env
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('✅ Archivo .env creado exitosamente');
  console.log(`📁 Ubicación: ${envPath}`);
  console.log('\n📋 Contenido copiado desde .env.example');
  console.log('\n⚠️  Verifica que las credenciales sean correctas:');
  console.log('   - DB_HOST');
  console.log('   - DB_PORT');
  console.log('   - DB_USER');
  console.log('   - DB_PASSWORD');
  console.log('   - JWT_SECRET');
  
} catch (error) {
  console.error('❌ Error creando .env:', error.message);
  process.exit(1);
}
