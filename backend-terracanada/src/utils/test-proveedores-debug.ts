/**
 * Script de prueba para debuggear la función proveedor_get_all()
 * Se ejecuta automáticamente al iniciar el servidor
 */

import db from '../config/database';
import { QueryTypes } from 'sequelize';

export async function testProveedorFunctions() {
  try {
    console.log('\n' + '='.repeat(100));
    console.log('🧪 INICIANDO PRUEBAS DE FUNCIONES POSTGRESQL DE PROVEEDORES');
    console.log('='.repeat(100));

    // TEST 1: Contar total de proveedores
    console.log('\n📊 TEST 1: Contando TOTAL de proveedores en la tabla');
    console.log('-'.repeat(100));
    try {
      const countAllResult = await db.query(
        `SELECT COUNT(*) as total FROM proveedores`,
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Resultado:', countAllResult);
      const totalCount = (countAllResult[0] as any).total;
      console.log(`📈 Total de proveedores: ${totalCount}`);
    } catch (error) {
      console.error('❌ Error en TEST 1:', error);
    }

    // TEST 2: Contar proveedores activos
    console.log('\n📊 TEST 2: Contando proveedores ACTIVOS (esta_activo = TRUE)');
    console.log('-'.repeat(100));
    try {
      const countActiveResult = await db.query(
        `SELECT COUNT(*) as total FROM proveedores WHERE esta_activo = TRUE`,
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Resultado:', countActiveResult);
      const activeCount = (countActiveResult[0] as any).total;
      console.log(`📈 Total de proveedores activos: ${activeCount}`);
    } catch (error) {
      console.error('❌ Error en TEST 2:', error);
    }

    // TEST 3: Ver primeros 3 proveedores
    console.log('\n📊 TEST 3: Listando primeros 3 proveedores de la tabla');
    console.log('-'.repeat(100));
    try {
      const proveedoresResult = await db.query(
        `SELECT id, nombre, servicio, esta_activo, fecha_creacion FROM proveedores ORDER BY fecha_creacion DESC LIMIT 3`,
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Resultado:');
      proveedoresResult.forEach((p: any, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${p.id}, Nombre: ${p.nombre}, Servicio: ${p.servicio}, Activo: ${p.esta_activo}`);
      });
    } catch (error) {
      console.error('❌ Error en TEST 3:', error);
    }

    // TEST 4: Llamar función proveedor_get_all()
    console.log('\n📊 TEST 4: Llamando función PostgreSQL proveedor_get_all()');
    console.log('-'.repeat(100));
    try {
      const functionResult = await db.query(
        `SELECT * FROM proveedor_get_all()`,
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Resultado RAW:', JSON.stringify(functionResult, null, 2));

      if (functionResult && functionResult.length > 0) {
        const rawResponse = (functionResult[0] as any).proveedor_get_all;
        console.log('\n📦 Raw Response (sin parsear):');
        console.log('  Type:', typeof rawResponse);
        console.log('  Value:', rawResponse);

        // Parsear si es string
        let parsedResponse = rawResponse;
        if (typeof rawResponse === 'string') {
          console.log('\n🔄 Parseando JSON string...');
          parsedResponse = JSON.parse(rawResponse);
        }

        console.log('\n✅ Respuesta parseada:');
        console.log('  Status:', parsedResponse.status);
        console.log('  Message:', parsedResponse.message);
        console.log('  Data type:', Array.isArray(parsedResponse.data) ? 'Array' : typeof parsedResponse.data);
        console.log('  Data length:', Array.isArray(parsedResponse.data) ? parsedResponse.data.length : 'N/A');

        if (Array.isArray(parsedResponse.data)) {
          console.log('\n📋 Proveedores retornados:');
          parsedResponse.data.forEach((p: any, idx: number) => {
            console.log(`  ${idx + 1}. ${p.nombre} (ID: ${p.id}, Servicio: ${p.servicio})`);
          });
        }
      } else {
        console.log('⚠️ La función retornó un array vacío');
      }
    } catch (error) {
      console.error('❌ Error en TEST 4:', error);
    }

    // TEST 5: Consulta SQL directa para comparar
    console.log('\n📊 TEST 5: Consulta SQL directa (sin función)');
    console.log('-'.repeat(100));
    try {
      const directResult = await db.query(
        `SELECT id, nombre, servicio, esta_activo FROM proveedores WHERE esta_activo = TRUE ORDER BY fecha_creacion DESC`,
        { type: QueryTypes.SELECT }
      );
      console.log(`✅ Resultado: ${directResult.length} proveedores encontrados`);
      directResult.forEach((p: any, idx: number) => {
        console.log(`  ${idx + 1}. ${p.nombre}`);
      });
    } catch (error) {
      console.error('❌ Error en TEST 5:', error);
    }

    // TEST 6: Probar función proveedor_get(1)
    console.log('\n📊 TEST 6: Llamando función proveedor_get(1)');
    console.log('-'.repeat(100));
    try {
      const getByIdResult = await db.query(
        `SELECT * FROM proveedor_get(1)`,
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Resultado:', JSON.stringify(getByIdResult, null, 2));
    } catch (error) {
      console.error('❌ Error en TEST 6:', error);
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ PRUEBAS COMPLETADAS');
    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error general en testProveedorFunctions:', error);
  }
}
