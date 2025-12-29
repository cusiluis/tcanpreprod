const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function verifyIds() {
  try {
    console.log('Verificando IDs en la base de datos...\n');

    // Verificar clientes
    const clientes = await sequelize.query(`
      SELECT id, nombre FROM clientes WHERE esta_activo = TRUE LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('📋 Clientes activos:');
    if (clientes.length === 0) {
      console.log('  ❌ No hay clientes activos');
    } else {
      clientes.forEach(c => console.log(`  - ID: ${c.id}, Nombre: ${c.nombre}`));
    }

    // Verificar proveedores
    const proveedores = await sequelize.query(`
      SELECT id, nombre FROM proveedores WHERE esta_activo = TRUE LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n📋 Proveedores activos:');
    if (proveedores.length === 0) {
      console.log('  ❌ No hay proveedores activos');
    } else {
      proveedores.forEach(p => console.log(`  - ID: ${p.id}, Nombre: ${p.nombre}`));
    }

    // Verificar cuentas bancarias
    const cuentas = await sequelize.query(`
      SELECT id, numero_cuenta, saldo FROM cuentas_bancarias WHERE esta_activo = TRUE LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n📋 Cuentas bancarias activas:');
    if (cuentas.length === 0) {
      console.log('  ❌ No hay cuentas bancarias activas');
    } else {
      cuentas.forEach(c => console.log(`  - ID: ${c.id}, Cuenta: ${c.numero_cuenta}, Saldo: ${c.saldo}`));
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyIds();
