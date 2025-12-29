import { Router, Request, Response } from 'express';
import db from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

/**
 * Endpoint de debug para probar la función proveedor_get_all()
 */
router.get('/proveedor-test', async (req: Request, res: Response) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEBUG: Probando función proveedor_get_all()');
    console.log('='.repeat(80));

    // TEST 1: Contar proveedores en la tabla
    console.log('\n📊 TEST 1: Contando proveedores en la tabla');
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM proveedores`,
      { type: QueryTypes.SELECT }
    );
    console.log('Total de proveedores en tabla:', countResult);

    // TEST 2: Contar proveedores activos
    console.log('\n📊 TEST 2: Contando proveedores activos');
    const countActiveResult = await db.query(
      `SELECT COUNT(*) as total FROM proveedores WHERE esta_activo = TRUE`,
      { type: QueryTypes.SELECT }
    );
    console.log('Total de proveedores activos:', countActiveResult);

    // TEST 3: Ver primeros 5 proveedores
    console.log('\n📊 TEST 3: Primeros 5 proveedores');
    const proveedoresResult = await db.query(
      `SELECT id, nombre, servicio, esta_activo FROM proveedores LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    console.log('Proveedores:', proveedoresResult);

    // TEST 4: Llamar la función PostgreSQL
    console.log('\n📊 TEST 4: Llamando función proveedor_get_all()');
    const functionResult = await db.query(
      `SELECT * FROM proveedor_get_all()`,
      { type: QueryTypes.SELECT }
    );
    console.log('Resultado de función:', JSON.stringify(functionResult, null, 2));

    // TEST 5: Parsear el resultado
    console.log('\n📊 TEST 5: Parseando resultado');
    if (functionResult && functionResult.length > 0) {
      const rawResponse = (functionResult[0] as any).proveedor_get_all;
      console.log('Raw response:', rawResponse);
      console.log('Type:', typeof rawResponse);

      let parsedResponse = rawResponse;
      if (typeof rawResponse === 'string') {
        parsedResponse = JSON.parse(rawResponse);
      }
      console.log('Parsed response:', JSON.stringify(parsedResponse, null, 2));

      if (parsedResponse.data) {
        console.log('Data array length:', parsedResponse.data.length);
        console.log('Data:', JSON.stringify(parsedResponse.data, null, 2));
      }
    }

    // Responder con los resultados
    res.json({
      success: true,
      data: {
        countResult,
        countActiveResult,
        proveedoresResult,
        functionResult
      }
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
