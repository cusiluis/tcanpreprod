#!/usr/bin/env node

/**
 * Script para probar la conexión a la base de datos PostgreSQL
 * Uso: node test-db-connection.js
 */

const { Sequelize } = require('sequelize');

const dbConfig = {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  database: 'terra_canada',
  username: 'admin',
  password: 'ag!Z:_dmgrgi4n1rg2r43',
  dialect: 'postgres'
};

console.log('\n🔍 Probando conexión a la base de datos...\n');
console.log('📊 Configuración:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.username}`);
console.log('\n⏳ Conectando...\n');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('\n✅ ¡Conexión exitosa!\n');
    
    // Obtener información de la BD
    const result = await sequelize.query("SELECT version();");
    console.log('📋 Información de PostgreSQL:');
    console.log(result[0][0].version);
    
    // Listar tablas
    console.log('\n📊 Tablas en la base de datos:\n');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tables[0].length === 0) {
      console.log('⚠️  No hay tablas en la base de datos');
    } else {
      tables[0].forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }
    
    // Contar registros en tabla usuarios
    console.log('\n👥 Verificando tabla usuarios:\n');
    try {
      const usuarios = await sequelize.query('SELECT COUNT(*) as count FROM usuarios;');
      const count = usuarios[0][0].count;
      console.log(`   Total de usuarios: ${count}`);
      
      if (count > 0) {
        const users = await sequelize.query('SELECT id, nombre_usuario, nombre_completo, rol_id FROM usuarios LIMIT 5;');
        console.log('\n   Primeros usuarios:');
        users[0].forEach(user => {
          console.log(`   - ${user.nombre_usuario} (${user.nombre_completo}) - rol_id: ${user.rol_id}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Tabla usuarios no existe o no es accesible');
    }
    
    // Contar permisos
    console.log('\n🔐 Verificando tabla permisos:\n');
    try {
      const permisos = await sequelize.query('SELECT COUNT(*) as count FROM permisos;');
      const count = permisos[0][0].count;
      console.log(`   Total de permisos: ${count}`);
    } catch (error) {
      console.log('⚠️  Tabla permisos no existe o no es accesible');
    }
    
    // Contar roles
    console.log('\n👤 Verificando tabla roles:\n');
    try {
      const roles = await sequelize.query('SELECT id, nombre FROM roles;');
      console.log(`   Total de roles: ${roles[0].length}`);
      roles[0].forEach(role => {
        console.log(`   - ${role.nombre} (id: ${role.id})`);
      });
    } catch (error) {
      console.log('⚠️  Tabla roles no existe o no es accesible');
    }
    
    console.log('\n✅ Prueba completada exitosamente\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error de conexión:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   Posible causa: Host no encontrado');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Posible causa: Conexión rechazada (verifica puerto)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Posible causa: Usuario o contraseña incorrectos');
    }
    
    console.error('\n📋 Verifica:');
    console.error('   - Host: epanel.salazargroup.cloud');
    console.error('   - Port: 5433');
    console.error('   - Database: terra_canada');
    console.error('   - User: admin');
    console.error('   - Password: ag!Z:_dmgrgi4n1rg2r43');
    console.error('   - Conexión a internet disponible');
    console.error('   - Firewall permite conexiones a puerto 5433\n');
    
    process.exit(1);
  }
})();
