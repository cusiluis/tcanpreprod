import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DashboardData, StatCard, Activity, MenuItem } from '../../shared/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItemsSubject.asObservable();

  private readonly apiUrl = 'https://terra-canada-test-back.vamw1k.easypanel.host/api/v1/dashboard';

  constructor(private http: HttpClient) {
    // Sólo inicializamos el menú aquí; los datos de dashboard se cargan
    // explícitamente desde el módulo de Dashboard cuando el usuario
    // realmente tiene acceso y entra a ese módulo.
    this.initializeMenuItems();
  }

  private initializeMenuItems(): void {
    const menuItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/dashboard',
        translationKey: 'menuDashboard'
      },
      {
        id: 'equipos',
        label: 'Equipo - Tarjetas',
        icon: 'pi pi-users',
        route: '/equipo-tarjetas',
        translationKey: 'menuEquipoTarjetas'
      },
      {
        id: 'financieros-bancaria',
        label: 'Financieros - C. Bancaria',
        icon: 'pi pi-wallet',
        route: '/financieros',
        translationKey: 'menuFinancierosCuenta'
      },
      {
        id: 'financieros-tarjetas',
        label: 'Financieros - Tarjetas',
        icon: 'pi pi-money-bill',
        route: '/financieros-tarjetas',
        translationKey: 'menuFinancierosTarjetas'
      },
      {
        id: 'gmail-gen',
        label: 'Gmail-GEN',
        icon: 'pi pi-envelope',
        route: '/gmail-gen',
        translationKey: 'menuGmailGen'
      },
      {
        id: 'analisis',
        label: 'Análisis',
        icon: 'pi pi-chart-bar',
        route: '/analisis',
        translationKey: 'menuAnalisis'
      },
      {
        id: 'documentos',
        label: 'Documentos',
        icon: 'pi pi-file',
        route: '/documentos',
        translationKey: 'menuDocumentos'
      },
      {
        id: 'tarjetas',
        label: 'Tarjetas',
        icon: 'pi pi-credit-card',
        route: '/tarjetas',
        translationKey: 'menuTarjetas'
      },
      {
        id: 'eventos',
        label: 'Eventos',
        icon: 'pi pi-calendar',
        route: '/eventos',
        translationKey: 'menuEventos'
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: 'pi pi-cog',
        route: '/configuracion',
        translationKey: 'menuConfiguracion',
        children: [
          {
            id: 'configuracion-perfil',
            label: 'Perfil de Usuario',
            icon: 'pi pi-user',
            route: '/configuracion/perfil',
            translationKey: 'menuConfiguracionPerfil'
          },
          {
            id: 'configuracion-usuarios',
            label: 'Gestión de Usuarios',
            icon: 'pi pi-users',
            route: '/configuracion/usuarios',
            translationKey: 'menuConfiguracionUsuarios'
          },
          {
            id: 'configuracion-seguridad',
            label: 'Seguridad',
            icon: 'pi pi-lock',
            route: '/configuracion/seguridad',
            translationKey: 'menuConfiguracionSeguridad'
          }
        ]
      }
    ];
    this.menuItemsSubject.next(menuItems);
  }

  loadDashboardData(fechaDesde?: string, fechaHasta?: string): void {
    console.log('DashboardService.loadDashboardData() - Cargando datos desde API de dashboard', {
      fechaDesde,
      fechaHasta
    });

    const params: string[] = [];
    if (fechaDesde) {
      params.push(`fechaDesde=${encodeURIComponent(fechaDesde)}`);
    }
    if (fechaHasta) {
      params.push(`fechaHasta=${encodeURIComponent(fechaHasta)}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    forkJoin({
      kpis: this.http
        .get<{ success: boolean; data: any }>(`${this.apiUrl}/kpis${query}`)
        .pipe(
          tap((response) => {
            console.log('DashboardService.loadDashboardData() - KPIs recibidos:', response);
          }),
          catchError((error) => {
            console.error('DashboardService.loadDashboardData() - Error KPIs:', error);
            return of({ success: false, data: null });
          })
        ),
      registros: this.http
        .get<{ success: boolean; data: any[] }>(
          `${this.apiUrl}/registros-pagos?limit=20&offset=0${query ? `&${query.substring(1)}` : ''}`
        )
        .pipe(
          tap((response) => {
            console.log('DashboardService.loadDashboardData() - Registros recibidos:', response);
          }),
          catchError((error) => {
            console.error('DashboardService.loadDashboardData() - Error registros pagos:', error);
            return of({ success: false, data: [] });
          })
        )
    })
      .pipe(
        map(({ kpis, registros }) => {
          const dataKpis = kpis && kpis.success && kpis.data ? kpis.data : {};
          const registrosData =
            registros && registros.success && Array.isArray(registros.data)
              ? registros.data
              : [];

          const stats: StatCard[] = this.mapKpisToStats(dataKpis);
          const activities: Activity[] = this.mapRegistrosToActivities(registrosData);

          const dashboard: DashboardData = {
            stats,
            activities
          };

          return dashboard;
        })
      )
      .subscribe({
        next: (dashboard) => {
          console.log('DashboardService.loadDashboardData() - Dashboard construido:', dashboard);
          this.dashboardDataSubject.next(dashboard);
        },
        error: (error) => {
          console.error('DashboardService.loadDashboardData() - Error combinando datos:', error);
        }
      });
  }

  private mapKpisToStats(data: any): StatCard[] {
    const pagados = Number(data?.pagados ?? 0);
    const porPagar = Number(data?.por_pagar ?? 0);
    const verificados = Number(data?.verificados ?? 0);
    const noVerificados = Number(data?.no_verificados ?? 0);
    const emailsEspera = Number(data?.emails_espera ?? 0);
    const emailsEnviados = Number(data?.emails_enviados ?? 0);

    const stats: StatCard[] = [
      {
        id: 'pagos-estado-pagado',
        title: 'pagosEstadoPagado',
        value: pagados,
        icon: 'pi pi-credit-card',
        color: '#2d7a7a',
        trend: porPagar,
        trendDirection: porPagar > 0 ? 'down' : 'up'
      },
      {
        id: 'pagos-verificados',
        title: 'pagosVerificados',
        value: verificados,
        icon: 'pi pi-check-circle',
        color: '#2d7a7a',
        trend: noVerificados,
        trendDirection: noVerificados > 0 ? 'down' : 'up'
      },
      {
        id: 'emails-espera-envio',
        title: 'emailsEsperaEnvio',
        value: emailsEspera,
        icon: 'pi pi-envelope',
        color: '#2d7a7a'
      },
      {
        id: 'emails-enviados',
        title: 'emailsEnviados',
        value: emailsEnviados,
        icon: 'pi pi-send',
        color: '#2d7a7a'
      }
    ];

    return stats;
  }

  private mapRegistrosToActivities(registros: any[]): Activity[] {
    return registros.map((item, index) => {
      const fechaIso: string = item.fecha_creacion || new Date().toISOString();
      const fecha = new Date(fechaIso);

      const dateStr = fecha.toISOString().slice(0, 10);
      const timeStr = fecha.toTimeString().slice(0, 5);

      const verificado = !!item.verificado;
      const status: Activity['status'] = verificado ? 'completado' : 'sin-verificacion';

      const activity: Activity = {
        id: String(item.id ?? index + 1),
        date: dateStr,
        time: timeStr,
        user: item.proveedor || 'N/A',
        client: item.cliente || undefined,
        action: item.correo || item.tipo_pago || 'Pago registrado',
        amount: typeof item.total === 'number' ? item.total : Number(item.total || 0),
        currency: 'CAD',
        paymentStatus: (item.estado as Activity['paymentStatus']) || undefined,
        verified: verificado,
        status
      };

      return activity;
    });
  }

  getDashboardData(): Observable<DashboardData | null> {
    return this.dashboardData$;
  }

  getMenuItems(): Observable<MenuItem[]> {
    return this.menuItems$;
  }
}

