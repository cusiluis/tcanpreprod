import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Proveedor {
  id?: number;
  nombre: string;
  servicio: string;
  telefono?: string;
  telefono2?: string;
  correo?: string;
  correo2?: string;
  descripcion?: string;
  esta_activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'http://localhost:3000/api/v1/proveedores';
  private proveedoresSubject = new BehaviorSubject<Proveedor[]>([]);
  public proveedores$ = this.proveedoresSubject.asObservable();
  private proveedoresCargados = false;

  constructor(private http: HttpClient) {
    // No cargar proveedores en el constructor
    // Se cargarán cuando se necesiten (lazy loading)
  }

  /**
   * Cargar todos los proveedores
   */
  cargarProveedores(): void {
    console.log('ProveedorService.cargarProveedores() - Iniciando carga de proveedores');
    console.log('ProveedorService.cargarProveedores() - URL:', this.apiUrl);
    
    this.getAll().subscribe({
      next: (response) => {
        console.log('ProveedorService.cargarProveedores() - Respuesta recibida:', response);
        console.log('ProveedorService.cargarProveedores() - response.success:', response.success);
        console.log('ProveedorService.cargarProveedores() - response.data type:', typeof response.data);
        console.log('ProveedorService.cargarProveedores() - response.data:', response.data);
        
        if (response.success && response.data) {
          let proveedores: Proveedor[] = [];
          
          // La respuesta de la API tiene estructura: { success: true, data: [...], timestamp }
          // Donde data es el array de proveedores
          if (Array.isArray(response.data)) {
            console.log('ProveedorService.cargarProveedores() - Data es un array');
            proveedores = response.data;
          } else if (response.data && typeof response.data === 'object') {
            console.log('ProveedorService.cargarProveedores() - Data es un objeto');
            // Si response.data es un objeto con propiedad 'data'
            if ('data' in response.data) {
              const dataObj = response.data as any;
              console.log('ProveedorService.cargarProveedores() - Tiene propiedad data:', dataObj.data);
              if (Array.isArray(dataObj.data)) {
                proveedores = dataObj.data;
              }
            }
          }
          
          console.log('ProveedorService.cargarProveedores() - Proveedores cargados:', proveedores.length);
          console.log('ProveedorService.cargarProveedores() - Proveedores:', proveedores);
          this.proveedoresSubject.next(proveedores);
        } else {
          console.warn('ProveedorService.cargarProveedores() - Respuesta sin datos:', response);
          this.proveedoresSubject.next([]);
        }
      },
      error: (error) => {
        console.error('ProveedorService.cargarProveedores() - Error HTTP:', error.status, error.statusText);
        console.error('ProveedorService.cargarProveedores() - Mensaje:', error.error?.error?.message || error.message);
        console.error('ProveedorService.cargarProveedores() - Respuesta completa:', error.error);
        // No lanzar error, solo registrar en consola
        this.proveedoresSubject.next([]);
      }
    });
  }

  /**
   * Obtener todos los proveedores
   */
  getAll(page: number = 1, limit: number = 100): Observable<ApiResponse<Proveedor[]>> {
    console.log('ProveedorService.getAll() - Obteniendo proveedores');
    return this.http.get<ApiResponse<Proveedor[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  /**
   * Obtener proveedor por ID
   */
  getById(id: number): Observable<ApiResponse<Proveedor>> {
    console.log('ProveedorService.getById() - Obteniendo proveedor:', id);
    return this.http.get<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo proveedor
   */
  create(proveedor: Proveedor): Observable<ApiResponse<Proveedor>> {
    console.log('ProveedorService.create() - Enviando POST a:', this.apiUrl);
    console.log('Datos:', proveedor);
    
    return this.http.post<ApiResponse<Proveedor>>(this.apiUrl, proveedor).pipe(
      tap((response) => {
        console.log('ProveedorService.create() - Respuesta exitosa:', response);
        this.cargarProveedores();
      })
    );
  }

  /**
   * Actualizar proveedor
   */
  update(id: number, proveedor: Proveedor): Observable<ApiResponse<Proveedor>> {
    console.log('ProveedorService.update() - Enviando PUT a:', `${this.apiUrl}/${id}`);
    console.log('Datos:', proveedor);
    
    return this.http.put<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`, proveedor).pipe(
      tap((response) => {
        console.log('ProveedorService.update() - Respuesta exitosa:', response);
        this.cargarProveedores();
      })
    );
  }

  /**
   * Eliminar proveedor
   */
  delete(id: number): Observable<ApiResponse<any>> {
    console.log('ProveedorService.delete() - Enviando DELETE a:', `${this.apiUrl}/${id}`);
    
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        console.log('ProveedorService.delete() - Respuesta exitosa:', response);
        this.cargarProveedores();
      })
    );
  }

  /**
   * Buscar proveedores por servicio
   */
  search(servicio: string): Observable<ApiResponse<Proveedor[]>> {
    console.log('ProveedorService.search() - Buscando proveedores por servicio:', servicio);
    return this.http.get<ApiResponse<Proveedor[]>>(`${this.apiUrl}/search?servicio=${servicio}`);
  }
}
