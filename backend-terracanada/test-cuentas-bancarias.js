const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function testCuentasBancarias() {
  try {
    console.log('=== PRUEBA DE CUENTAS BANCARIAS ===\n');

    // Paso 1: Verificar cuentas en BD
    console.log('📝 Paso 1: Verificando cuentas bancarias en BD...');
    const cuentasDB = await sequelize.query(`
      SELECT 
        cb.id,
        cb.numero_cuenta,
        cb.nombre_banco,
        cb.titular_cuenta,
        cb.saldo,
        cb.limite,
        cb.tipo_moneda_id,
        tm.nombre as tipo_moneda_nombre
      FROM cuentas_bancarias cb
      LEFT JOIN tipos_moneda tm ON cb.tipo_moneda_id = tm.id
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('✅ Total de cuentas en BD:', cuentasDB.length);
    if (cuentasDB.length === 0) {
      console.log('  ❌ No hay cuentas bancarias en la BD');
    } else {
      cuentasDB.forEach((c, idx) => {
        console.log(`\n  Cuenta ${idx + 1}:`);
        console.log(`    ID: ${c.id}`);
        console.log(`    Banco: ${c.nombre_banco}`);
        console.log(`    Número: ${c.numero_cuenta}`);
        console.log(`    Titular: ${c.titular_cuenta}`);
        console.log(`    Saldo: ${c.saldo}`);
        console.log(`    Tipo Moneda: ${c.tipo_moneda_nombre} (${c.tipo_moneda_codigo})`);
      });
    }

    // Paso 2: Obtener token válido
    console.log('\n\n📝 Paso 2: Obteniendo token válido...');
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
    console.log('✅ Token obtenido');
    console.log('   Usuario:', loginData.data.usuario.nombre_usuario);
    console.log('   Rol:', loginData.data.usuario.rol_nombre);

    // Paso 3: Probar GET /api/v1/cuentas-bancarias
    console.log('\n📝 Paso 3: Probando GET /api/v1/cuentas-bancarias...');
    const cuentasResponse = await fetch('http://localhost:3000/api/v1/cuentas-bancarias', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const cuentasData = await cuentasResponse.json();
    console.log('Status:', cuentasResponse.status);
    
    if (cuentasResponse.status === 200) {
      console.log('✅ Respuesta exitosa');
      console.log('   Total de cuentas:', cuentasData.data ? cuentasData.data.length : 0);
      if (cuentasData.data && cuentasData.data.length > 0) {
        console.log('\n   Primeras 3 cuentas:');
        cuentasData.data.slice(0, 3).forEach((c, idx) => {
          console.log(`   ${idx + 1}. ID: ${c.id}, Banco: ${c.nombre_banco}, Tipo: ${c.tipo_moneda?.nombre || 'N/A'}`);
        });
      }
    } else {
      console.error('❌ Error:', cuentasResponse.status);
      console.error('   Mensaje:', cuentasData.error?.message || cuentasData.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testCuentasBancarias();
