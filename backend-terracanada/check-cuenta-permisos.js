const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function checkPermissions() {
  try {
    console.log('Verificando permisos de cuentas bancarias...\n');

    // Obtener todos los permisos de cuentas bancarias
    const cuentaPermisos = await sequelize.query(`
      SELECT id, nombre, descripcion FROM permisos 
      WHERE nombre LIKE 'cuenta%'
      ORDER BY nombre
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 Permisos de cuentas bancarias encontrados:');
    cuentaPermisos.forEach(p => {
      console.log(`  - ${p.nombre} (ID: ${p.id})`);
      console.log(`    Descripción: ${p.descripcion}`);
    });

    // Verificar si están asignados al rol Administrador
    console.log('\n🔐 Verificando asignación al rol Administrador:');
    const asignados = await sequelize.query(`
      SELECT p.nombre, p.id
      FROM rol_permisos rp
      JOIN permisos p ON rp.permiso_id = p.id
      WHERE rp.rol_id = 1 AND p.nombre LIKE 'cuenta%'
      ORDER BY p.nombre
    `, { type: sequelize.QueryTypes.SELECT });

    if (asignados.length === 0) {
      console.log('  ❌ Ningún permiso de cuentas bancarias está asignado');
    } else {
      console.log(`  ✅ ${asignados.length} permisos asignados:`);
      asignados.forEach(p => console.log(`    - ${p.nombre}`));
    }

    // Mostrar los que falta asignar
    const faltantes = cuentaPermisos.filter(p => !asignados.find(a => a.id === p.id));
    if (faltantes.length > 0) {
      console.log(`\n⚠️  ${faltantes.length} permisos pendientes de asignar:`);
      faltantes.forEach(p => console.log(`    - ${p.nombre}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPermissions();
