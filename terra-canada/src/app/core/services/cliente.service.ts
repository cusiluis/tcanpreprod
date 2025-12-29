import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Cliente {
  id?: number;
  nombre: string;
  ubicacion?: string;
  telefono?: string;
  correo?: string;
  esta_activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:3000/api/v1/clientes';
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  public clientes$ = this.clientesSubject.asObservable();
  private clientesCargados = false;

  constructor(private http: HttpClient) {
    // No cargar clientes en el constructor
    // Se cargarán cuando se necesiten (lazy loading)
  }

  /**
   * Cargar todos los clientes
   */
  cargarClientes(): void {
    console.log('ClienteService.cargarClientes() - Iniciando carga de clientes');
    console.log('ClienteService.cargarClientes() - URL:', this.apiUrl);
    
    this.getAll().subscribe({
      next: (response) => {
        console.log('ClienteService.cargarClientes() - Respuesta recibida:', response);
        if (response.success && response.data) {
          let clientes: Cliente[] = [];
          if (Array.isArray(response.data)) {
            clientes = response.data;
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            clientes = (response.data as any).data || [];
          }
          console.log('ClienteService.cargarClientes() - Clientes cargados:', clientes.length);
          this.clientesSubject.next(clientes);
        } else {
          console.warn('ClienteService.cargarClientes() - Respuesta sin datos');
          this.clientesSubject.next([]);
        }
      },
      error: (error) => {
        console.error('ClienteService.cargarClientes() - Error HTTP:', error.status, error.statusText);
        console.error('ClienteService.cargarClientes() - Mensaje:', error.error?.error?.message || error.message);
        console.error('ClienteService.cargarClientes() - Respuesta completa:', error.error);
        // No lanzar error, solo registrar en consola
        this.clientesSubject.next([]);
      }
    });
  }

  /**
   * Obtener todos los clientes
   */
  getAll(page: number = 1, limit: number = 100): Observable<ApiResponse<Cliente[]>> {
    console.log('ClienteService.getAll() - Obteniendo clientes desde:', `${this.apiUrl}?page=${page}&limit=${limit}`);
    return this.http.get<ApiResponse<Cliente[]>>(
      `${this.apiUrl}?page=${page}&limit=${limit}`
    ).pipe(
      tap((response) => {
        console.log('ClienteService.getAll() - Respuesta recibida:', response);
      })
    );
  }

  /**
   * Obtener cliente por ID
   */
  getById(id: number): Observable<ApiResponse<Cliente>> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo cliente
   */
  create(cliente: Cliente): Observable<ApiResponse<Cliente>> {
    console.log('ClienteService.create() - Enviando POST a:', this.apiUrl);
    console.log('Datos:', cliente);
    
    return this.http.post<ApiResponse<Cliente>>(this.apiUrl, cliente).pipe(
      tap((response) => {
        console.log('ClienteService.create() - Respuesta exitosa:', response);
        this.cargarClientes();
      })
    );
  }

  /**
   * Actualizar cliente
   */
  update(id: number, cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
    return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, cliente).pipe(
      tap(() => {
        this.cargarClientes();
      })
    );
  }

  /**
   * Eliminar cliente (soft delete)
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cargarClientes();
      })
    );
  }

  /**
   * Buscar clientes
   */
  search(termino: string, page: number = 1, limit: number = 10): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/buscar?termino=${termino}&page=${page}&limit=${limit}`
    );
  }

  /**
   * Obtener clientes actuales del BehaviorSubject
   */
  obtenerClientesActuales(): Cliente[] {
    return this.clientesSubject.value;
  }

  /**
   * Filtrar clientes por nombre
   */
  filtrarPorNombre(nombre: string): Cliente[] {
    const clientes = this.clientesSubject.value;
    if (!nombre || nombre.trim() === '') {
      return [];
    }
    const nombreLower = nombre.toLowerCase();
    return clientes.filter(c => c.nombre.toLowerCase().includes(nombreLower));
  }
}
