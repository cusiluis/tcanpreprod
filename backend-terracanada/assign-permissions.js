const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('terra_canada', 'admin', 'ag!Z:_dmgrgi4n1rg2r43', {
  host: 'epanel.salazargroup.cloud',
  port: 5433,
  dialect: 'postgres',
  logging: console.log
});

async function assignPermissions() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    // Obtener los IDs de los permisos
    const permisos = await sequelize.query(`
      SELECT id, nombre FROM permisos 
      WHERE nombre IN (
        'pago_bancario_post',
        'pago_bancario_put',
        'pago_bancario_delete',
        'pago_bancario_delete_permanente',
        'cuenta_bancaria_post',
        'cuenta_bancaria_put',
        'cuenta_bancaria_delete'
      )
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📋 Permisos encontrados:');
    permisos.forEach(p => console.log(`  - ${p.nombre} (ID: ${p.id})`));

    // Asignar permisos al rol Administrador (rol_id = 1)
    console.log('\n🔐 Asignando permisos al rol Administrador...');
    
    for (const permiso of permisos) {
      await sequelize.query(`
        INSERT INTO rol_permisos (rol_id, permiso_id)
        VALUES (1, ${permiso.id})
        ON CONFLICT DO NOTHING
      `);
      console.log(`  ✅ Permiso asignado: ${permiso.nombre}`);
    }

    console.log('\n✅ Todos los permisos han sido asignados correctamente');

    // Verificar los permisos asignados
    console.log('\n📊 Verificando permisos del rol Administrador:');
    const result = await sequelize.query(`
      SELECT p.nombre, p.descripcion
      FROM rol_permisos rp
      JOIN permisos p ON rp.permiso_id = p.id
      WHERE rp.rol_id = 1
      ORDER BY p.nombre
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`Total de permisos: ${result.length}`);
    result.forEach(p => console.log(`  - ${p.nombre}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

assignPermissions();
