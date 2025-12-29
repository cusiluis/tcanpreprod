import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { EventoService, Evento } from '../../../../core/services/evento.service';
import { AuthService } from '../../../../core/services/auth.service';

interface EventoRegistro {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  documento: string;
}

@Component({
  selector: 'app-eventos-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './eventos-registro.component.html',
  styleUrl: './eventos-registro.component.scss'
  })
export class EventosRegistroComponent implements OnInit {
  eventos: EventoRegistro[] = [];
  filteredEventos: EventoRegistro[] = [];
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

    // En esta tabla mostramos principalmente eventos de tipo ACCION
    // Usamos getEventos() (GET /api/v1/eventos) y filtramos por tipo_evento en el frontend
    this.eventoService
      .getEventos()
      .subscribe({
        next: (page) => {
          const backendEventos = page?.data || [];
          console.log('EventosRegistroComponent - backendEventos length:', backendEventos.length);

          // Primero quedarnos solo con eventos de tipo ACCION
          // - Admin: verá todas las acciones de todos los usuarios (admin + equipo)
          // - Equipo: ya viene filtrado desde el backend solo a usuarios Equipo
          const filtrados = backendEventos.filter((evento: any) => evento.tipo_evento === 'ACCION');

          this.eventos = filtrados.map((evento) => this.mapEventoToRegistro(evento));
          console.log('EventosRegistroComponent - filtrados finales length:', filtrados.length);
          this.filteredEventos = [...this.eventos];
          this.cdr.detectChanges();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando eventos de registro:', error);
          this.errorMessage =
            error.error?.error?.message || error.message || 'Error cargando eventos';
          this.isLoading = false;
        }
      });
  }

  private mapEventoToRegistro(evento: Evento): EventoRegistro {
    const usuario = (evento as any).usuario || (evento as any).Usuario;

    return {
      id: evento.id?.toString() || '',
      fecha: evento.fecha_creacion
        ? new Date(evento.fecha_creacion).toLocaleString()
        : '',
      usuario:
        usuario?.nombre_completo || usuario?.nombre_usuario || 'Sistema / Automático',
      accion: evento.accion || evento.tipo_evento,
      documento:
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
      evento.documento.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredEventos = [...this.eventos];
  }
}
