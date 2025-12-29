import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nombre_usuario: string;
  correo: string;
  nombre_completo: string;
  telefono?: string;
  esta_activo: boolean;
  fecha_creacion?: string;
  rol?: { id: number; nombre: string } | null;
  Role?: { id: number; nombre: string } | null;
  rol_nombre?: string;
}

export interface PaginatedUsuariosResponse {
  data: Usuario[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateUsuarioPayload {
  nombre_usuario: string;
  correo: string;
  contrasena: string;
  nombre_completo: string;
  rol_id: number;
  telefono?: string;
}

export interface UpdateUsuarioPayload {
  nombre_usuario?: string;
  correo?: string;
  nombre_completo?: string;
  telefono?: string;
  esta_activo?: boolean;
  rol_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/usuarios';

  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  usuarios$ = this.usuariosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUsuarios(page: number = 1, limit: number = 50): Observable<PaginatedUsuariosResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap((resp) => {
        console.log('UsuarioService.getUsuarios - respuesta cruda:', resp);
      }),
      map((resp) => resp.data as PaginatedUsuariosResponse)
    );
  }

  cargarUsuarios(page: number = 1, limit: number = 50): void {
    this.getUsuarios(page, limit).subscribe({
      next: (pageResp) => {
        const usuarios = pageResp?.data || [];
        this.usuariosSubject.next(usuarios);
      },
      error: (error) => {
        console.error('UsuarioService.cargarUsuarios - error HTTP:', error);
      }
    });
  }

  recargarUsuarios(): void {
    this.cargarUsuarios();
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap((resp) => {
        console.log('UsuarioService.getUsuarioById - respuesta cruda:', resp);
      }),
      map((resp) => resp.data as Usuario)
    );
  }

  buscarUsuarios(nombre_usuario?: string, correo?: string, page: number = 1, limit: number = 50): Observable<PaginatedUsuariosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (nombre_usuario) {
      params = params.set('nombre_usuario', nombre_usuario);
    }

    if (correo) {
      params = params.set('correo', correo);
    }

    return this.http.get<any>(`${this.apiUrl}/buscar`, { params }).pipe(
      tap((resp) => {
        console.log('UsuarioService.buscarUsuarios - respuesta cruda:', resp);
      }),
      map((resp) => resp.data as PaginatedUsuariosResponse)
    );
  }

  crearUsuario(payload: CreateUsuarioPayload): Observable<Usuario> {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((resp) => {
        console.log('UsuarioService.crearUsuario - respuesta cruda:', resp);
      }),
      map((resp) => resp.data as Usuario)
    );
  }

  actualizarUsuario(id: number, payload: UpdateUsuarioPayload): Observable<Usuario> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      tap((resp) => {
        console.log('UsuarioService.actualizarUsuario - respuesta cruda:', resp);
      }),
      map((resp) => resp.data as Usuario)
    );
  }

  desactivarUsuario(id: number): Observable<void> {
    return this.http.put<any>(`${this.apiUrl}/${id}/desactivar`, {}).pipe(
      tap((resp) => {
        console.log('UsuarioService.desactivarUsuario - respuesta cruda:', resp);
      }),
      map(() => void 0)
    );
  }

  activarUsuario(id: number): Observable<void> {
    return this.http.put<any>(`${this.apiUrl}/${id}/activar`, {}).pipe(
      tap((resp) => {
        console.log('UsuarioService.activarUsuario - respuesta cruda:', resp);
      }),
      map(() => void 0)
    );
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap((resp) => {
        console.log('UsuarioService.eliminarUsuario - respuesta cruda:', resp);
      }),
      map(() => void 0)
    );
  }

  cambiarContrasena(
    id: number,
    contrasenaActual: string,
    contrasenaNueva: string
  ): Observable<void> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/cambiar-contrasena`, {
        contrasena_actual: contrasenaActual,
        contrasena_nueva: contrasenaNueva
      })
      .pipe(
        tap((resp) => {
          console.log('UsuarioService.cambiarContrasena - respuesta cruda:', resp);
        }),
        map((resp) => {
          // Considerar éxito cuando no se provee la bandera 'success'.
          // Solo tratar explícitamente como error cuando success === false.
          if (resp?.success === false) {
            const message =
              resp?.error?.message ||
              resp?.message ||
              'Error cambiando contraseña';
            throw new Error(message);
          }
          return void 0;
        })
      );
  }
}
