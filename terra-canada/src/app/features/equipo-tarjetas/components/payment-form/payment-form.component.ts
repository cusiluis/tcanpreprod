import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { ProveedorService, Proveedor } from '../../../../core/services/proveedor.service';
import { TarjetaService, Tarjeta as TarjetaAPI } from '../../../../core/services/tarjeta.service';
import { PagoService } from '../../../../core/services/pago.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ProveedorDisplay {
  id: string;
  nombre: string;
  servicio: string;
  correo?: string;
  correo2?: string;
}


interface ClienteDisplay {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() isVisible = false;
  @Input() enableAutomaticNumeroPresta = false;
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  // Datos de clientes desde API
  clientes: ClienteDisplay[] = [];

  // Datos de proveedores desde API
  proveedores: ProveedorDisplay[] = [];

  // Tarjetas desde API
  tarjetas: TarjetaAPI[] = [];
  tarjetaSeleccionada: TarjetaAPI | null = null;
  
  // Filtrado de tarjetas por moneda
  tarjetasFiltradas: TarjetaAPI[] = [];
  monedaSeleccionada: number | null = null;
  
  // Opciones de moneda disponibles (mapeo con tipo_tarjeta_id)
  monedasDisponibles = [
    { id: 1, nombre: 'USD - Dólar Estadounidense' },
    { id: 2, nombre: 'CAD - Dólar Canadiense' }
  ];

  // Año actual para mostrar en ayudas de N° Presta
  currentYear: number = new Date().getFullYear();

  // Control de generación automática de N° Presta
  numeroPrestaAutomatico = false;
  generandoNumeroPresta = false;
  numeroPrestaError: string | null = null;

  // Autocomplete
  clientesFiltrados: ClienteDisplay[] = [];
  proveedoresFiltrados: ProveedorDisplay[] = [];
  mostrarClientesDropdown = false;
  mostrarProveedoresDropdown = false;

  // Correos del proveedor seleccionado
  correosDisponibles: string[] = [];
  mostrarDropdownCorreos = false;
  proveedorSeleccionado: ProveedorDisplay | null = null;

  // Modal para agregar cliente/proveedor
  mostrarModalNuevoCliente = false;
  mostrarModalNuevoProveedor = false;
  nuevoClienteNombre = '';
  nuevoClienteUbicacion = '';
  nuevoClienteTelefono = '';
  nuevoClienteCorreo = '';
  nuevoProveedorNombre = '';
  nuevoProveedorServicio = '';
  nuevoProveedorTelefono = '';
  nuevoProveedorTelefono2 = '';
  nuevoProveedorCorreo = '';
  nuevoProveedorCorreo2 = '';
  nuevoProveedorDescripcion = '';

  constructor(
    private clienteService: ClienteService,
    private proveedorService: ProveedorService,
    private tarjetaService: TarjetaService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.initializeFormListeners();
    // Cargar clientes, proveedores y tarjetas solo cuando sea necesario
    this.cargarClientesLazy();
    this.cargarProveedoresLazy();
    this.cargarTarjetasLazy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarClientesLazy(): void {
    console.log('PaymentFormComponent - Cargando clientes lazily');
    this.clienteService.cargarClientes();
    
    this.clienteService.clientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((clientes: Cliente[]) => {
        console.log('PaymentFormComponent - Clientes recibidos:', clientes);
        this.clientes = clientes.map(c => ({
          id: (c.id?.toString() || '') as string,
          nombre: c.nombre
        })) as ClienteDisplay[];
      });
  }

  private cargarProveedoresLazy(): void {
    console.log('PaymentFormComponent - Cargando proveedores lazily');
    this.proveedorService.cargarProveedores();
    
    this.proveedorService.proveedores$
      .pipe(takeUntil(this.destroy$))
      .subscribe((proveedores: Proveedor[]) => {
        console.log('PaymentFormComponent - Proveedores recibidos:', proveedores);
        this.proveedores = proveedores.map(p => ({
          id: (p.id?.toString() || '') as string,
          nombre: p.nombre,
          servicio: p.servicio,
          correo: p.correo || undefined,
          correo2: p.correo2 || undefined
        })) as ProveedorDisplay[];
      });
  }

  private cargarTarjetasLazy(): void {
    console.log('PaymentFormComponent - Cargando tarjetas lazily');
    this.tarjetaService.loadTarjetas();
    
    this.tarjetaService.tarjetas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tarjetas: TarjetaAPI[]) => {
        console.log('PaymentFormComponent - Tarjetas recibidas:', tarjetas);
        this.tarjetas = tarjetas;

        // Si ya hay una moneda seleccionada, volver a aplicar el filtro
        if (this.monedaSeleccionada) {
          this.onSeleccionarMoneda(this.monedaSeleccionada);
        }
      });
  }

  private initializeFormListeners(): void {
    // Listener para autocomplete de cliente
    if (this.form.get('clienteNombre')) {
      this.form.get('clienteNombre')?.valueChanges.subscribe((valor: string) => {
        console.log('Cliente input cambió:', valor);
        this.filtrarClientes(valor);
      });
    }

    // Listener para autocomplete de proveedor
    if (this.form.get('proveedorNombre')) {
      this.form.get('proveedorNombre')?.valueChanges.subscribe((valor: string) => {
        console.log('Proveedor input cambió:', valor);
        this.filtrarProveedores(valor);
      });
    }

    // Listener para cambio de moneda seleccionada
    if (this.form.get('moneda')) {
      this.form.get('moneda')?.valueChanges.subscribe((monedaId: any) => {
        console.log('Moneda seleccionada cambió:', monedaId);
        this.onSeleccionarMoneda(monedaId);
      });
    }

    // Listener para cambio de tarjeta seleccionada
    if (this.form.get('tarjeta')) {
      this.form.get('tarjeta')?.valueChanges.subscribe((tarjetaId: any) => {
        if (tarjetaId) {
          console.log('Tarjeta seleccionada cambió:', tarjetaId);
          this.onSeleccionarTarjeta(parseInt(tarjetaId, 10));
        }
      });
    }

  }

  filtrarClientes(valor: string): void {
    if (!valor || valor.trim() === '') {
      this.clientesFiltrados = [];
      this.mostrarClientesDropdown = false;
      return;
    }

    const valorLower = valor.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(valorLower)
    );
    this.mostrarClientesDropdown = this.clientesFiltrados.length > 0;
  }

  filtrarProveedores(valor: string): void {
    if (!valor || valor.trim() === '') {
      this.proveedoresFiltrados = [];
      this.mostrarProveedoresDropdown = false;
      return;
    }

    const valorLower = valor.toLowerCase();
    this.proveedoresFiltrados = this.proveedores.filter(p =>
      p.nombre.toLowerCase().includes(valorLower) || p.servicio.toLowerCase().includes(valorLower)
    );
    this.mostrarProveedoresDropdown = this.proveedoresFiltrados.length > 0;
  }

  onClienteFocus(): void {
    if (this.clientes.length > 0) {
      this.clientesFiltrados = this.clientes;
      this.mostrarClientesDropdown = true;
    }
  }

  onClienteBlur(): void {
    setTimeout(() => {
      this.mostrarClientesDropdown = false;
    }, 200);
  }

  onProveedorFocus(): void {
    if (this.proveedores.length > 0) {
      this.proveedoresFiltrados = this.proveedores;
      this.mostrarProveedoresDropdown = true;
    }
  }

  onProveedorBlur(): void {
    setTimeout(() => {
      this.mostrarProveedoresDropdown = false;
    }, 200);
  }

  seleccionarCliente(cliente: ClienteDisplay): void {
    this.form.patchValue({ cliente: cliente.id }, { emitEvent: false });
    this.form.patchValue({ clienteNombre: cliente.nombre }, { emitEvent: false });
    this.mostrarClientesDropdown = false;
  }

  seleccionarProveedor(proveedor: ProveedorDisplay): void {
    this.form.patchValue({ proveedor: proveedor.id }, { emitEvent: false });
    this.form.patchValue({ proveedorNombre: proveedor.nombre }, { emitEvent: false });
    this.mostrarProveedoresDropdown = false;
    this.proveedorSeleccionado = proveedor;

    // Auto-llenar correos disponibles
    this.correosDisponibles = [];
    if (proveedor.correo) {
      this.correosDisponibles.push(proveedor.correo);
    }
    if (proveedor.correo2) {
      this.correosDisponibles.push(proveedor.correo2);
    }

    console.log('Proveedor seleccionado:', proveedor);
    console.log('Correos disponibles:', this.correosDisponibles);

    // Si hay correos disponibles, auto-llenar el primero
    if (this.correosDisponibles.length > 0) {
      this.form.patchValue({ correo: this.correosDisponibles[0] }, { emitEvent: false });
      this.mostrarDropdownCorreos = this.correosDisponibles.length > 1;
    } else {
      this.form.patchValue({ correo: '' }, { emitEvent: false });
      this.mostrarDropdownCorreos = false;
    }
  }

  seleccionarCorreo(correo: string): void {
    this.form.patchValue({ correo: correo }, { emitEvent: false });
    this.mostrarDropdownCorreos = false;
  }

  abrirModalNuevoCliente(): void {
    this.mostrarModalNuevoCliente = true;
  }

  cerrarModalNuevoCliente(): void {
    this.mostrarModalNuevoCliente = false;
    this.nuevoClienteNombre = '';
    this.nuevoClienteUbicacion = '';
    this.nuevoClienteTelefono = '';
    this.nuevoClienteCorreo = '';
  }

  guardarNuevoCliente(): void {
    console.log('guardarNuevoCliente() llamado');
    console.log('Nombre:', this.nuevoClienteNombre);
    
    if (!this.nuevoClienteNombre || !this.nuevoClienteNombre.trim()) {
      console.warn('Nombre de cliente vacío');
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    const nuevoCliente: Cliente = {
      nombre: this.nuevoClienteNombre.trim(),
      ubicacion: this.nuevoClienteUbicacion?.trim() || undefined,
      telefono: this.nuevoClienteTelefono?.trim() || undefined,
      correo: this.nuevoClienteCorreo?.trim() || undefined
    };

    console.log('Enviando cliente:', nuevoCliente);

    this.clienteService.create(nuevoCliente)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.success && response.data) {
            const clienteDisplay: ClienteDisplay = {
              id: response.data.id?.toString() || '',
              nombre: response.data.nombre
            };
            console.log('Cliente creado:', clienteDisplay);
            this.clientes.push(clienteDisplay);
            this.seleccionarCliente(clienteDisplay);
            this.cerrarModalNuevoCliente();
            alert(`✅ Cliente "${response.data.nombre}" creado exitosamente`);
          } else {
            console.error('Respuesta sin datos:', response);
            alert('Error: No se recibieron datos del servidor');
          }
        },
        error: (error) => {
          console.error('Error creando cliente:', error);
          console.error('Detalles del error:', error.error);
          alert(`❌ Error al crear cliente: ${error.error?.error?.message || error.message || 'Error desconocido'}`);
        }
      });
  }

  abrirModalNuevoProveedor(): void {
    this.mostrarModalNuevoProveedor = true;
  }

  cerrarModalNuevoProveedor(): void {
    this.mostrarModalNuevoProveedor = false;
    this.nuevoProveedorNombre = '';
    this.nuevoProveedorServicio = '';
    this.nuevoProveedorTelefono = '';
    this.nuevoProveedorTelefono2 = '';
    this.nuevoProveedorCorreo = '';
    this.nuevoProveedorCorreo2 = '';
    this.nuevoProveedorDescripcion = '';
  }

  guardarNuevoProveedor(): void {
    console.log('guardarNuevoProveedor() llamado');
    console.log('Nombre:', this.nuevoProveedorNombre);
    
    if (!this.nuevoProveedorNombre || !this.nuevoProveedorNombre.trim()) {
      console.warn('Nombre de proveedor vacío');
      alert('Por favor ingrese el nombre del proveedor');
      return;
    }

    if (!this.nuevoProveedorServicio || !this.nuevoProveedorServicio.trim()) {
      console.warn('Servicio de proveedor vacío');
      alert('Por favor ingrese el servicio del proveedor');
      return;
    }

    const nuevoProveedor: Proveedor = {
      nombre: this.nuevoProveedorNombre.trim(),
      servicio: this.nuevoProveedorServicio.trim(),
      telefono: this.nuevoProveedorTelefono?.trim() || undefined,
      telefono2: this.nuevoProveedorTelefono2?.trim() || undefined,
      correo: this.nuevoProveedorCorreo?.trim() || undefined,
      correo2: this.nuevoProveedorCorreo2?.trim() || undefined,
      descripcion: this.nuevoProveedorDescripcion?.trim() || undefined
    };

    console.log('Enviando proveedor:', nuevoProveedor);

    this.proveedorService.create(nuevoProveedor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.success && response.data) {
            const proveedorDisplay: ProveedorDisplay = {
              id: response.data.id?.toString() || '',
              nombre: response.data.nombre,
              servicio: response.data.servicio
            };
            console.log('Proveedor creado:', proveedorDisplay);
            this.proveedores.push(proveedorDisplay);
            this.seleccionarProveedor(proveedorDisplay);
            this.cerrarModalNuevoProveedor();
            alert(`✅ Proveedor "${response.data.nombre}" creado exitosamente`);
          } else {
            console.error('Respuesta sin datos:', response);
            alert('Error: No se recibieron datos del servidor');
          }
        },
        error: (error) => {
          console.error('Error creando proveedor:', error);
          console.error('Detalles del error:', error.error);
          alert(`❌ Error al crear proveedor: ${error.error?.error?.message || error.message || 'Error desconocido'}`);
        }
      });
  }

  /**
   * Manejar selección de moneda
   * Filtra las tarjetas disponibles según la moneda seleccionada
   */
  onSeleccionarMoneda(monedaId: any): void {
    const monedaIdNum = parseInt(monedaId, 10);
    this.monedaSeleccionada = monedaIdNum;
    console.log('Moneda seleccionada (ID):', monedaIdNum);
    
    // Filtrar tarjetas por tipo.id
    if (monedaIdNum) {
      // Solo mostrar tarjetas ACTIVAS para registrar pagos
      this.tarjetasFiltradas = this.tarjetas.filter(
        (t) =>
          t.tipo.id === monedaIdNum &&
          t.estado?.nombre &&
          t.estado.nombre.toLowerCase() === 'activo'
      );

      console.log('Tarjetas filtradas por moneda y estado activo:', this.tarjetasFiltradas);
      console.log('Total tarjetas filtradas (activas):', this.tarjetasFiltradas.length);
    } else {
      this.tarjetasFiltradas = [];
    }
    
    // Limpiar la tarjeta seleccionada cuando cambia la moneda
    this.form.patchValue({ tarjeta: '' }, { emitEvent: false });
    this.tarjetaSeleccionada = null;
  }

  /**
   * Obtener moneda de la tarjeta seleccionada
   */
  obtenerMonedaTarjeta(): string {
    if (!this.monedaSeleccionada) return '';
    const moneda = this.monedasDisponibles.find(m => m.id === this.monedaSeleccionada);
    return moneda ? moneda.nombre : '';
  }

  /**
   * Manejar selección de tarjeta
   * Actualiza la tarjeta seleccionada
   */
  onSeleccionarTarjeta(tarjetaId: number): void {
    const tarjeta = this.tarjetasFiltradas.find(t => t.id === tarjetaId);
    if (tarjeta) {
      this.tarjetaSeleccionada = tarjeta;
      console.log('Tarjeta seleccionada:', tarjeta);
      console.log('Moneda de la tarjeta:', tarjeta.tipo.nombre);
    }
  }

  setNumeroPrestaModo(automatico: boolean): void {
    this.numeroPrestaAutomatico = automatico;
    this.numeroPrestaError = null;

    const control = this.form.get('numeroPresta');
    if (!control) {
      return;
    }

    // Resetear estado visual de validación al cambiar de modo
    control.markAsPristine();
    control.markAsUntouched();
    control.updateValueAndValidity({ onlySelf: true, emitEvent: false });

    if (automatico) {
      control.setValue('');
      this.generarNumeroPrestaAutomatico();
    }
  }

  private generarNumeroPrestaAutomatico(): void {
    const control = this.form.get('numeroPresta');
    if (!control) {
      return;
    }

    this.generandoNumeroPresta = true;
    this.numeroPrestaError = null;

    this.pagoService
      .getAll(undefined, 'todos', 'todos')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let nextId = 1;

          if (response && Array.isArray(response.data)) {
            const ids = response.data
              .map((pago: any) => pago.id)
              .filter((id: any) => typeof id === 'number');

            if (ids.length > 0) {
              const maxId = Math.max(...ids);
              nextId = maxId + 1;
            }
          }

          const year = new Date().getFullYear();
          const codigo = `TARJE-${year}-${nextId}`;

          control.setValue(codigo);
          control.markAsDirty();
          control.updateValueAndValidity();

          this.generandoNumeroPresta = false;
        },
        error: (error) => {
          console.error('Error generando N° Presta automático:', error);
          this.numeroPrestaError = 'No se pudo generar el N° Presta automático';
          this.generandoNumeroPresta = false;
        }
      });
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
