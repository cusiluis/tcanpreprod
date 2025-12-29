import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { EventoService, Evento } from '../../../../core/services/evento.service';
import { AuthService } from '../../../../core/services/auth.service';

interface EventoInteraccion {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  registro: string;
}

@Component({
  selector: 'app-eventos-interaccion',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './eventos-interaccion.component.html',
  styleUrl: './eventos-interaccion.component.scss'
  })
export class EventosInteraccionComponent implements OnInit {
  eventos: EventoInteraccion[] = [];
  filteredEventos: EventoInteraccion[] = [];
  searchTerm: string = '';
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private eventoService: EventoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeEventos();
  }

  private initializeEventos(): void {
    this.cargarEventos();
  }

  private cargarEventos(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // En esta tabla nos enfocamos en eventos de tipo NAVEGACION / interacciones
    // Usamos getEventos() (GET /api/v1/eventos) y filtramos por tipo_evento en el frontend
    this.eventoService
      .getEventos()
      .subscribe({
        next: (page) => {
          const backendEventos = page?.data || [];

          const currentUser = this.authService.getCurrentUser();

          // Primero quedarnos solo con eventos de tipo NAVEGACION
          let filtrados = backendEventos.filter((evento: any) => evento.tipo_evento === 'NAVEGACION');

          // Para administradores, aquí mostramos principalmente interacciones de otros usuarios
          if (this.authService.isAdmin() && currentUser) {
            const currentUserId = Number(currentUser.id);
            filtrados = filtrados.filter((evento: any) => {
              const usuario = (evento as any).usuario || (evento as any).Usuario;
              return usuario?.id !== currentUserId;
            });
          }

          this.eventos = filtrados.map((evento) => this.mapEventoToInteraccion(evento));
          this.filteredEventos = [...this.eventos];
          this.cdr.detectChanges();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando eventos de interacción:', error);
          this.errorMessage =
            error.error?.error?.message || error.message || 'Error cargando eventos';
          this.isLoading = false;
        }
      });
  }

  private mapEventoToInteraccion(evento: Evento): EventoInteraccion {
    const usuario = (evento as any).usuario || (evento as any).Usuario;

    return {
      id: evento.id?.toString() || '',
      fecha: evento.fecha_creacion
        ? new Date(evento.fecha_creacion).toLocaleString()
        : '',
      usuario:
        usuario?.nombre_completo || usuario?.nombre_usuario || 'Sistema / Automático',
      accion: evento.accion || evento.tipo_evento,
      registro:
        evento.descripcion ||
        `${evento.tipo_entidad || ''} ${evento.entidad_id || ''}`.trim()
    };
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredEventos = [...this.eventos];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredEventos = this.eventos.filter(evento =>
      evento.fecha.toLowerCase().includes(term) ||
      evento.usuario.toLowerCase().includes(term) ||
      evento.accion.toLowerCase().includes(term) ||
      evento.registro.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredEventos = [...this.eventos];
  }
}
