#!/usr/bin/env node

/**
 * Script para generar un JWT Secret seguro
 * Uso: node generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generar un secret de 32 bytes (256 bits) en formato hexadecimal
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 JWT Secret Generado:\n');
console.log(secret);
console.log('\n📋 Copia este valor en tu archivo .env como:\n');
console.log(`JWT_SECRET=${secret}\n`);

// También generar una versión base64 como alternativa
const secretBase64 = crypto.randomBytes(32).toString('base64');
console.log('📋 O esta versión en base64:\n');
console.log(`JWT_SECRET=${secretBase64}\n`);
