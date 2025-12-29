const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function testTarjetas() {
  try {
    console.log('Verificando tarjetas en la base de datos...\n');

    // Prueba 1: Ver estructura de la tabla tarjetas
    const schema = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'tarjetas'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('📋 Columnas de la tabla tarjetas:');
    schema.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));

    // Prueba 2: Contar tarjetas
    const countResult = await sequelize.query(`
      SELECT COUNT(*) as total FROM tarjetas
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n📊 Total de tarjetas:', countResult[0].total);

    // Prueba 3: Obtener primeras 5 tarjetas
    const tarjetas = await sequelize.query(`
      SELECT 
        t.id,
        t.numero_tarjeta,
        t.nombre_titular,
        t.saldo,
        t.limite,
        t.tipo_tarjeta_id,
        t.estado_tarjeta_id,
        tm.id as tipo_id_moneda,
        tm.nombre as tipo_nombre
      FROM tarjetas t
      LEFT JOIN tipos_moneda tm ON t.tipo_tarjeta_id = tm.id
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📋 Primeras 5 tarjetas:');
    if (tarjetas.length === 0) {
      console.log('  ❌ No hay tarjetas en la BD');
    } else {
      tarjetas.forEach((t, idx) => {
        console.log(`\n  Tarjeta ${idx + 1}:`);
        console.log(`    ID: ${t.id}`);
        console.log(`    Número: ${t.numero_tarjeta}`);
        console.log(`    Titular: ${t.nombre_titular}`);
        console.log(`    Saldo: ${t.saldo}`);
        console.log(`    Tipo Moneda: ${t.tipo_nombre} (ID: ${t.tipo_id_moneda})`);
      });
    }

    // Prueba 3: Verificar la ruta GET /api/v1/tarjetas
    console.log('\n\n🔍 Probando ruta GET /api/v1/tarjetas...');
    const response = await fetch('http://localhost:3000/api/v1/tarjetas', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlX3VzdWFyaW8iOiJhZG1pbiIsImNvcnJlbyI6ImFkbWluQHRlcnJhY2FuYWRhLmNvbSIsIm5vbWJyZV9jb21wbGV0byI6IkFkbWluaXN0cmFkb3IgUHJpbmNpcGFsIiwicm9sX2lkIjoxLCJyb2xfbm9tYnJlIjoiQWRtaW5pc3RyYWRvciIsInBlcm1pc29zIjpbInVzdWFyaW9zLmNyZWFyIiwidXN1YXJpb3MubGVlciIsInVzdWFyaW9zLmVkaXRhciIsInVzdWFyaW9zLmVsaW1pbmFyIiwicGFnb3MuY3JlYXIiLCJwYWdvcy5sZWVyIiwicGFnb3MuZWRpdGFyIiwicGFnb3MuZWxpbWluYXIiLCJwYWdvcy52ZXJpZmljYXIiLCJldmVudG9zLmxlZXIiLCJldmVudG9zLmZpbHRyYXIiLCJjb25maWd1cmFjaW9uLmxlZXIiLCJjb25maWd1cmFjaW9uLmVkaXRhciIsInRhcmpldGFzLmxlZXIiLCJ0YXJqZXRhcy5lZGl0YXIiLCJjbGllbnRlcy5jcmVhciIsImNsaWVudGVzLmxlZXIiLCJjbGllbnRlcy5lZGl0YXIiLCJwcm92ZWVkb3Jlcy5jcmVhciIsInByb3ZlZWRvcmVzLmxlZXIiLCJwcm92ZWVkb3Jlcy5lZGl0YXIiLCJ0YXJqZXRhcy5jcmVhciIsInRhcmpldGFzLmVsaW1pbmFyIiwiY2xpZW50ZXMuZWxpbWluYXIiLCJwcm92ZWVkb3Jlcy5lbGltaW5hciIsInRhcmpldGFzLmVsaW1pbmFyX3Blcm1hbmVudGUiLCJjdWVudGFfYmFuY2FyaWFfcG9zdCIsImN1ZW50YV9iYW5jYXJpYV9wdXQiLCJjdWVudGFfYmFuY2FyaWFfZGVsZXRlIiwicGFnb19iYW5jYXJpb19wb3N0IiwicGFnb19iYW5jYXJpb19wdXQiLCJwYWdvX2JhbmNhcmlvX2RlbGV0ZSIsInBhZ29fYmFuY2FyaW9fZGVsZXRlX3Blcm1hbmVudGUiXSwiaWF0IjoxNzY1OTI3MzQxLCJleHAiOjE3NjYwMTM3NDF9.XXXXXX'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testTarjetas();
