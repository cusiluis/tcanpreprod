/**
 * Script de prueba para verificar que todas las funciones PostgreSQL de proveedores funcionan correctamente
 * Ejecutar con: npx ts-node src/test-proveedores.ts
 */

import db from './config/database';
import { QueryTypes } from 'sequelize';

async function testProveedorFunctions() {
  try {
    console.log('='.repeat(80));
    console.log('INICIANDO PRUEBAS DE FUNCIONES POSTGRESQL DE PROVEEDORES');
    console.log('='.repeat(80));

    // TEST 1: proveedor_get_all() - Obtener todos los proveedores activos
    console.log('\n📋 TEST 1: proveedor_get_all() - Obtener todos los proveedores activos');
    console.log('-'.repeat(80));
    try {
      const resultGetAll = await db.query(
        `SELECT * FROM proveedor_get_all()`,
        { type: QueryTypes.SELECT }
      );
      
      console.log('✅ Respuesta de proveedor_get_all():');
      console.log(JSON.stringify(resultGetAll, null, 2));
      
      if (resultGetAll && resultGetAll.length > 0) {
        const response = (resultGetAll[0] as any).proveedor_get_all;
        console.log('\n📊 Datos parseados:');
        console.log(JSON.stringify(response, null, 2));
        
        if (typeof response === 'string') {
          const parsed = JSON.parse(response);
          console.log('\n✅ Proveedores encontrados:', parsed.data.length);
          parsed.data.forEach((p: any, idx: number) => {
            console.log(`  ${idx + 1}. ${p.nombre} (ID: ${p.id}, Servicio: ${p.servicio})`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error en proveedor_get_all():', error);
    }

    // TEST 2: proveedor_get(id) - Obtener un proveedor específico
    console.log('\n\n📋 TEST 2: proveedor_get(id) - Obtener un proveedor específico');
    console.log('-'.repeat(80));
    try {
      const resultGet = await db.query(
        `SELECT * FROM proveedor_get(:id)`,
        {
          replacements: { id: 1 },
          type: QueryTypes.SELECT
        }
      );
      
      console.log('✅ Respuesta de proveedor_get(1):');
      console.log(JSON.stringify(resultGet, null, 2));
      
      if (resultGet && resultGet.length > 0) {
        const response = (resultGet[0] as any).proveedor_get;
        console.log('\n📊 Datos parseados:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error en proveedor_get():', error);
    }

    // TEST 3: proveedor_post() - Crear un nuevo proveedor
    console.log('\n\n📋 TEST 3: proveedor_post() - Crear un nuevo proveedor');
    console.log('-'.repeat(80));
    try {
      const resultPost = await db.query(
        `SELECT * FROM proveedor_post(
          :nombre,
          :servicio,
          :telefono,
          :telefono2,
          :correo,
          :correo2,
          :descripcion
        )`,
        {
          replacements: {
            nombre: 'Proveedor Test - ' + new Date().getTime(),
            servicio: 'Servicio de Prueba',
            telefono: '555-9999',
            telefono2: null,
            correo: 'test@example.com',
            correo2: null,
            descripcion: 'Proveedor creado por script de prueba'
          },
          type: QueryTypes.SELECT
        }
      );
      
      console.log('✅ Respuesta de proveedor_post():');
      console.log(JSON.stringify(resultPost, null, 2));
      
      if (resultPost && resultPost.length > 0) {
        const response = (resultPost[0] as any).proveedor_post;
        console.log('\n📊 Datos parseados:');
        console.log(JSON.stringify(response, null, 2));
        
        if (typeof response === 'string') {
          const parsed = JSON.parse(response);
          console.log(`\n✅ Proveedor creado exitosamente: ${parsed.data.nombre} (ID: ${parsed.data.id})`);
        }
      }
    } catch (error) {
      console.error('❌ Error en proveedor_post():', error);
    }

    // TEST 4: proveedor_put() - Actualizar un proveedor
    console.log('\n\n📋 TEST 4: proveedor_put() - Actualizar un proveedor');
    console.log('-'.repeat(80));
    try {
      const resultPut = await db.query(
        `SELECT * FROM proveedor_put(
          :id,
          :nombre,
          :servicio,
          :telefono,
          :telefono2,
          :correo,
          :correo2,
          :descripcion
        )`,
        {
          replacements: {
            id: 1,
            nombre: 'Proveedor Actualizado',
            servicio: 'Servicio Actualizado',
            telefono: '555-1111',
            telefono2: null,
            correo: 'actualizado@example.com',
            correo2: null,
            descripcion: 'Actualizado por script de prueba'
          },
          type: QueryTypes.SELECT
        }
      );
      
      console.log('✅ Respuesta de proveedor_put():');
      console.log(JSON.stringify(resultPut, null, 2));
      
      if (resultPut && resultPut.length > 0) {
        const response = (resultPut[0] as any).proveedor_put;
        console.log('\n📊 Datos parseados:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error en proveedor_put():', error);
    }

    // TEST 5: proveedor_delete() - Desactivar un proveedor
    console.log('\n\n📋 TEST 5: proveedor_delete() - Desactivar un proveedor');
    console.log('-'.repeat(80));
    try {
      // Primero, obtener el ID del último proveedor creado
      const lastProveedorResult = await db.query(
        `SELECT id FROM proveedores ORDER BY fecha_creacion DESC LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      
      if (lastProveedorResult && lastProveedorResult.length > 0) {
        const proveedorId = (lastProveedorResult[0] as any).id;
        console.log(`Desactivando proveedor con ID: ${proveedorId}`);
        
        const resultDelete = await db.query(
          `SELECT * FROM proveedor_delete(:id)`,
          {
            replacements: { id: proveedorId },
            type: QueryTypes.SELECT
          }
        );
        
        console.log('✅ Respuesta de proveedor_delete():');
        console.log(JSON.stringify(resultDelete, null, 2));
        
        if (resultDelete && resultDelete.length > 0) {
          const response = (resultDelete[0] as any).proveedor_delete;
          console.log('\n📊 Datos parseados:');
          console.log(JSON.stringify(response, null, 2));
        }
      }
    } catch (error) {
      console.error('❌ Error en proveedor_delete():', error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ PRUEBAS COMPLETADAS');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar pruebas
testProveedorFunctions();
