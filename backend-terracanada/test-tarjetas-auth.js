const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function testTarjetasWithAuth() {
  try {
    console.log('=== PRUEBA DE TARJETAS CON AUTENTICACIÓN ===\n');

    // Paso 1: Login para obtener token válido
    console.log('📝 Paso 1: Obteniendo token válido...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.data || !loginData.data.token) {
      console.error('❌ Error en login:', loginData);
      return;
    }

    const token = loginData.data.token;
    console.log('✅ Token obtenido:', token.substring(0, 50) + '...');
    console.log('   Usuario:', loginData.data.usuario.nombre_usuario);
    console.log('   Rol:', loginData.data.usuario.rol_nombre);
    console.log('   Permisos:', loginData.data.usuario.permisos.length, 'permisos');
    
    // Verificar si tiene el permiso tarjetas.leer
    const tienePermisoLeer = loginData.data.usuario.permisos.includes('tarjetas.leer');
    console.log('   ✅ Permiso "tarjetas.leer":', tienePermisoLeer ? 'SÍ' : 'NO');

    // Paso 2: Probar GET /api/v1/tarjetas con token válido
    console.log('\n📝 Paso 2: Probando GET /api/v1/tarjetas con token válido...');
    const tarjetasResponse = await fetch('http://localhost:3000/api/v1/tarjetas', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const tarjetasData = await tarjetasResponse.json();
    console.log('Status:', tarjetasResponse.status);
    
    if (tarjetasResponse.status === 200) {
      console.log('✅ Respuesta exitosa');
      console.log('   Total de tarjetas:', tarjetasData.data ? tarjetasData.data.length : 0);
      if (tarjetasData.data && tarjetasData.data.length > 0) {
        console.log('\n   Primeras 3 tarjetas:');
        tarjetasData.data.slice(0, 3).forEach((t, idx) => {
          console.log(`   ${idx + 1}. ID: ${t.id}, Titular: ${t.nombre_titular}, Tipo: ${t.tipo?.nombre || 'N/A'}`);
        });
      }
    } else {
      console.error('❌ Error:', tarjetasData.error?.message || tarjetasData.message);
    }

    // Paso 3: Verificar tarjetas en BD directamente
    console.log('\n📝 Paso 3: Verificando tarjetas en BD directamente...');
    const tarjetasDB = await sequelize.query(`
      SELECT 
        t.id,
        t.numero_tarjeta,
        t.nombre_titular,
        t.saldo,
        tm.nombre as tipo_nombre
      FROM tarjetas t
      LEFT JOIN tipos_moneda tm ON t.tipo_tarjeta_id = tm.id
      LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('✅ Tarjetas en BD:', tarjetasDB.length);
    tarjetasDB.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ID: ${t.id}, Titular: ${t.nombre_titular}, Tipo: ${t.tipo_nombre}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testTarjetasWithAuth();
