import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

/**
 * Interface para Tarjeta
 */
export interface Tarjeta {
  id: number;
  nombre_titular: string;
  numero_tarjeta: string;
  limite: number;
  saldo: number;
  disponible: number;
  tipo: {
    id: number;
    nombre: string;
  };
  estado: {
    id: number;
    nombre: string;
  };
  fecha_creacion: string;
}

/**
 * Interface para crear tarjeta
 */
export interface CreateTarjetaPayload {
  nombre_titular: string;
  numero_tarjeta: string;
  limite: number;
  tipo_tarjeta_id: number;
}

/**
 * Interface para actualizar tarjeta
 */
export interface UpdateTarjetaPayload {
  nombre_titular: string;
  limite: number;
}

/**
 * Interface para realizar cargo
 */
export interface CargoPayload {
  monto: number;
}

/**
 * Interface para realizar pago
 */
export interface PagoPayload {
  monto: number;
}

/**
 * TarjetaService
 * Servicio para gestionar operaciones CRUD de tarjetas
 */
@Injectable({
  providedIn: 'root'
})
export class TarjetaService {
  private readonly API_URL = 'http://localhost:3000/api/v1/tarjetas';
  
  private tarjetasSubject = new BehaviorSubject<Tarjeta[]>([]);
  public tarjetas$ = this.tarjetasSubject.asObservable();

  constructor(private http: HttpClient) {
    // No cargar tarjetas en el constructor
    // Se cargarán cuando el usuario inicie sesión o cuando se acceda al componente
  }

  /**
   * Cargar todas las tarjetas
   */
  loadTarjetas(): void {
    console.log('TarjetaService.loadTarjetas() - Iniciando carga de tarjetas');
    this.http.get<any>(this.API_URL).subscribe(
      (response: any) => {
        console.log('TarjetaService.loadTarjetas() - Respuesta recibida:', response);
        if (response.data && Array.isArray(response.data)) {
          console.log('TarjetaService.loadTarjetas() - ✅ Tarjetas cargadas:', response.data.length);
          this.tarjetasSubject.next(response.data);
        } else {
          console.warn('TarjetaService.loadTarjetas() - ⚠️ Respuesta sin datos válidos');
          this.tarjetasSubject.next([]);
        }
      },
      (error: any) => {
        console.error('TarjetaService.loadTarjetas() - ❌ Error cargando tarjetas:', error);
        console.error('TarjetaService.loadTarjetas() - Status:', error?.status);
        console.error('TarjetaService.loadTarjetas() - Message:', error?.error?.message);
        this.tarjetasSubject.next([]);
      }
    );
  }

  /**
   * Obtener todas las tarjetas
   */
  getAll(): Observable<any> {
    return this.http.get<any>(this.API_URL).pipe(
      tap((response) => {
        if (response.data && Array.isArray(response.data)) {
          this.tarjetasSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Obtener una tarjeta por ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  /**
   * Crear una nueva tarjeta
   */
  create(payload: CreateTarjetaPayload): Observable<any> {
    return this.http.post<any>(this.API_URL, payload).pipe(
      tap((response) => {
        if (response.data) {
          const tarjetas = this.tarjetasSubject.value;
          this.tarjetasSubject.next([...tarjetas, response.data]);
        }
      })
    );
  }

  /**
   * Actualizar una tarjeta
   */
  update(id: number, payload: UpdateTarjetaPayload): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, payload).pipe(
      tap((response) => {
        if (response.data) {
          const tarjetas = this.tarjetasSubject.value.map(t =>
            t.id === id ? response.data : t
          );
          this.tarjetasSubject.next(tarjetas);
        }
      })
    );
  }

  /**
   * Desactivar una tarjeta
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`).pipe(
      tap((response) => {
        const tarjetas = this.tarjetasSubject.value.filter(t => t.id !== id);
        this.tarjetasSubject.next(tarjetas);
      })
    );
  }

  /**
   * Realizar cargo a una tarjeta (aumentar saldo)
   */
  realizarCargo(id: number, payload: CargoPayload): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/cargo`, payload).pipe(
      tap((response) => {
        this.loadTarjetas();
      })
    );
  }

  /**
   * Realizar pago a una tarjeta (disminuir saldo)
   */
  realizarPago(id: number, payload: PagoPayload): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/pago`, payload).pipe(
      tap((response) => {
        this.loadTarjetas();
      })
    );
  }

  /**
   * Cambiar estado de una tarjeta
   */
  cambiarEstado(id: number, estadoTarjetaId: number): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/${id}/estado`, { estado_tarjeta_id: estadoTarjetaId }).pipe(
      tap((response) => {
        this.loadTarjetas();
      })
    );
  }

  /**
   * Eliminar una tarjeta permanentemente (solo admin)
   */
  deletePermanente(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}/permanente`).pipe(
      tap((response) => {
        this.loadTarjetas();
      })
    );
  }

  /**
   * Obtener tarjetas actualizadas
   */
  refreshTarjetas(): void {
    this.loadTarjetas();
  }
}
