import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Servicio de prueba para verificar que las funciones PostgreSQL de proveedores funcionan correctamente
 * Uso: Inyectar este servicio en un componente y llamar a testAllProveedorFunctions()
 */
@Injectable({
  providedIn: 'root'
})
export class TestProveedoresService {
  private apiUrl = 'http://localhost:3000/api/v1/proveedores';

  constructor(private http: HttpClient) {}

  /**
   * Ejecutar todas las pruebas de funciones de proveedores
   */
  async testAllProveedorFunctions(): Promise<void> {
    console.log('='.repeat(80));
    console.log('🧪 INICIANDO PRUEBAS DE FUNCIONES POSTGRESQL DE PROVEEDORES');
    console.log('='.repeat(80));

    // TEST 1: Obtener todos los proveedores
    await this.testGetAll();

    // TEST 2: Obtener un proveedor específico
    await this.testGetById(1);

    console.log('\n' + '='.repeat(80));
    console.log('✅ PRUEBAS COMPLETADAS');
    console.log('='.repeat(80));
  }

  /**
   * TEST 1: Obtener todos los proveedores activos
   */
  private testGetAll(): Promise<void> {
    return new Promise((resolve) => {
      console.log('\n📋 TEST 1: GET /api/v1/proveedores - Obtener todos los proveedores activos');
      console.log('-'.repeat(80));

      this.http.get<any>(`${this.apiUrl}`).subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success && response.data) {
            console.log(`\n📊 Total de proveedores: ${response.data.length}`);
            response.data.forEach((p: any, idx: number) => {
              console.log(`  ${idx + 1}. ${p.nombre} (ID: ${p.id}, Servicio: ${p.servicio}, Email: ${p.correo})`);
            });
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error en GET /proveedores:');
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error?.error?.message || error.message);
          console.error('Respuesta completa:', error.error);
          resolve();
        }
      });
    });
  }

  /**
   * TEST 2: Obtener un proveedor específico por ID
   */
  private testGetById(id: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`\n📋 TEST 2: GET /api/v1/proveedores/${id} - Obtener un proveedor específico`);
      console.log('-'.repeat(80));

      this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success && response.data) {
            const p = response.data;
            console.log(`\n📊 Proveedor encontrado:`);
            console.log(`  Nombre: ${p.nombre}`);
            console.log(`  ID: ${p.id}`);
            console.log(`  Servicio: ${p.servicio}`);
            console.log(`  Email: ${p.correo}`);
            console.log(`  Teléfono: ${p.telefono}`);
            console.log(`  Activo: ${p.esta_activo}`);
          }
          resolve();
        },
        error: (error) => {
          console.error(`❌ Error en GET /proveedores/${id}:`);
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error?.error?.message || error.message);
          console.error('Respuesta completa:', error.error);
          resolve();
        }
      });
    });
  }

  /**
   * TEST 3: Crear un nuevo proveedor
   */
  testCreate(): Promise<void> {
    return new Promise((resolve) => {
      console.log('\n📋 TEST 3: POST /api/v1/proveedores - Crear un nuevo proveedor');
      console.log('-'.repeat(80));

      const nuevoProveedor = {
        nombre: `Proveedor Test ${new Date().getTime()}`,
        servicio: 'Servicio de Prueba',
        telefono: '555-9999',
        correo: 'test@example.com',
        descripcion: 'Proveedor creado por script de prueba'
      };

      console.log('📤 Enviando datos:');
      console.log(JSON.stringify(nuevoProveedor, null, 2));

      this.http.post<any>(`${this.apiUrl}`, nuevoProveedor).subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success && response.data) {
            console.log(`\n✅ Proveedor creado exitosamente: ${response.data.nombre} (ID: ${response.data.id})`);
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error en POST /proveedores:');
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error?.error?.message || error.message);
          console.error('Respuesta completa:', error.error);
          resolve();
        }
      });
    });
  }

  /**
   * TEST 4: Actualizar un proveedor
   */
  testUpdate(id: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`\n📋 TEST 4: PUT /api/v1/proveedores/${id} - Actualizar un proveedor`);
      console.log('-'.repeat(80));

      const datosActualizados = {
        nombre: 'Proveedor Actualizado',
        servicio: 'Servicio Actualizado',
        telefono: '555-1111',
        correo: 'actualizado@example.com',
        descripcion: 'Actualizado por script de prueba'
      };

      console.log('📤 Enviando datos:');
      console.log(JSON.stringify(datosActualizados, null, 2));

      this.http.put<any>(`${this.apiUrl}/${id}`, datosActualizados).subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success && response.data) {
            console.log(`\n✅ Proveedor actualizado exitosamente: ${response.data.nombre}`);
          }
          resolve();
        },
        error: (error) => {
          console.error(`❌ Error en PUT /proveedores/${id}:`);
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error?.error?.message || error.message);
          console.error('Respuesta completa:', error.error);
          resolve();
        }
      });
    });
  }

  /**
   * TEST 5: Eliminar un proveedor
   */
  testDelete(id: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`\n📋 TEST 5: DELETE /api/v1/proveedores/${id} - Eliminar un proveedor`);
      console.log('-'.repeat(80));

      this.http.delete<any>(`${this.apiUrl}/${id}`).subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success) {
            console.log(`\n✅ Proveedor eliminado exitosamente`);
          }
          resolve();
        },
        error: (error) => {
          console.error(`❌ Error en DELETE /proveedores/${id}:`);
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error?.error?.message || error.message);
          console.error('Respuesta completa:', error.error);
          resolve();
        }
      });
    });
  }
}
