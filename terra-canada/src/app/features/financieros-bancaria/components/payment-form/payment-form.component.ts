import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PagoBancarioService } from '../../../../core/services/pago-bancario.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClienteService, Cliente } from '../../../../core/services/cliente.service';
import { ProveedorService, Proveedor } from '../../../../core/services/proveedor.service';

export interface CuentaBancaria {
  id: number;
  numero_cuenta: string;
  nombre_banco: string;
  saldo: number;
  limite: number;
  tipo_moneda?: number;
}

export interface TipoMoneda {
  id: number;
  nombre: string;
  codigo: string;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  
  clientes: Cliente[] = [];
  proveedores: Proveedor[] = [];
  cuentasBancarias: CuentaBancaria[] = [];
  cuentasBancariasFiltradas: CuentaBancaria[] = [];
  tiposMoneda: TipoMoneda[] = [
    { id: 1, nombre: 'Dólar Estadounidense', codigo: 'USD' },
    { id: 2, nombre: 'Dólar Canadiense', codigo: 'CAD' }
  ];
  
  filteredClientes: Cliente[] = [];
  filteredProveedores: Proveedor[] = [];
  
  showClienteDropdown = false;
  showProveedorDropdown = false;
  onClienteBlur() {
    setTimeout(() => {
      this.showClienteDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  onProveedorBlur() {
    setTimeout(() => {
      this.showProveedorDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }
  
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  // Toast de confirmación
  showSuccessToast = false;
  successToastMessage = '';
  
  // Modal nuevo cliente
  mostrarModalNuevoCliente = false;
  nuevoClienteNombre = '';
  nuevoClienteUbicacion = '';
  nuevoClienteTelefono = '';
  nuevoClienteCorreo = '';
  
  // Modal nuevo proveedor
  mostrarModalNuevoProveedor = false;
  nuevoProveedorNombre = '';
  nuevoProveedorServicio = '';
  nuevoProveedorTelefono = '';
  nuevoProveedorTelefono2 = '';
  nuevoProveedorCorreo = '';
  nuevoProveedorCorreo2 = '';
  nuevoProveedorDescripcion = '';
  
  // Propiedad para mostrar/ocultar el formulario
  isVisible = true;
  
  // Control de modo de N° Présta
  numeroPrestaAutomatico = false;
  numeroPrestaError: string | null = null;
  currentYear = new Date().getFullYear();
  
  // Propiedad para moneda seleccionada
  get monedaSeleccionada(): boolean {
    return !!this.paymentForm.get('tipoMoneda')?.value;
  }

  @Output() onSubmit = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private pagoBancarioService: PagoBancarioService,
    private clienteService: ClienteService,
    private proveedorService: ProveedorService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadProveedores();
    this.loadCuentasBancarias();
  }

  /**
   * Inicializar formulario reactivo
   */
  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      tipoMoneda: ['', Validators.required],
      clienteId: ['', Validators.required],
      clienteNombre: ['', Validators.required],
      proveedorId: ['', Validators.required],
      proveedorNombre: ['', Validators.required],
      correo: [{ value: '', disabled: true }, Validators.required],
      cuentaBancariaId: ['', Validators.required],
      monto: ['', Validators.required],
      numeroPresta: ['', Validators.required],
      comentarios: ['']
    });

    // Escuchar cambios en el tipo de moneda
    this.paymentForm.get('tipoMoneda')?.valueChanges.subscribe((tipoMonedaId) => {
      if (tipoMonedaId) {
        this.filtrarCuentasPorMoneda(tipoMonedaId);
      } else {
        // Si no hay tipo de moneda seleccionado, limpiar cuentas filtradas
        this.cuentasBancariasFiltradas = [];
      }
      this.paymentForm.get('cuentaBancariaId')?.reset();
      this.cdr.markForCheck();
    });

    // NO inicializar cuentas filtradas - dejar vacío hasta que se seleccione tipo de moneda
    this.cuentasBancariasFiltradas = [];
  }

  /**
   * Filtrar cuentas bancarias por tipo de moneda
   */
  filtrarCuentasPorMoneda(tipoMonedaId: any): void {
    const tipoMonedaIdNumerico = Number(tipoMonedaId);
    console.log('PaymentFormComponent - filtrarCuentasPorMoneda() - Filtrando por tipo de moneda:', tipoMonedaIdNumerico);
    console.log('PaymentFormComponent - Cuentas disponibles:', this.cuentasBancarias);
    
    // Filtrar cuentas que coincidan con el tipo de moneda seleccionado
    this.cuentasBancariasFiltradas = this.cuentasBancarias.filter((cuenta: any) => {
      const tipoMonedaCuenta = Number(cuenta.tipo_moneda);
      console.log(`Comparando: cuenta.tipo_moneda=${tipoMonedaCuenta} vs tipoMonedaId=${tipoMonedaIdNumerico}`);
      return tipoMonedaCuenta === tipoMonedaIdNumerico;
    });
    
    console.log('PaymentFormComponent - Cuentas filtradas:', this.cuentasBancariasFiltradas);
    this.cdr.markForCheck();
  }

  /**
   * Cargar clientes desde la API
   */
  private loadClientes(): void {
    console.log('PaymentFormComponent - Iniciando carga de clientes');
    // Usar el Observable clientes$ del servicio, igual que TarjetasListComponent
    this.clienteService.clientes$.subscribe({
      next: (clientes: any[]) => {
        console.log('PaymentFormComponent - Clientes recibidos del Observable:', clientes);
        this.clientes = clientes;
        this.filteredClientes = this.clientes;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('PaymentFormComponent - Error cargando clientes:', error);
        this.clientes = [];
        this.filteredClientes = [];
      }
    });
    // Llamar a cargarClientes para disparar la carga desde la API
    this.clienteService.cargarClientes();
  }

  /**
   * Cargar proveedores desde la API
   */
  private loadProveedores(): void {
    this.proveedorService.getAll().subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          this.proveedores = response.data.map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            servicio: p.servicio || 'Servicio no especificado',
            correo: p.correo
          }));
          this.filteredProveedores = this.proveedores;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.proveedores = [];
        this.filteredProveedores = [];
      }
    });
  }

  /**
   * Cargar cuentas bancarias desde la API
   */
  private loadCuentasBancarias(): void {
    console.log('PaymentFormComponent - Iniciando carga de cuentas bancarias');
    this.pagoBancarioService.getCuentasBancarias().subscribe({
      next: (response: any) => {
        console.log('PaymentFormComponent - Respuesta de cuentas bancarias:', response);
        if (response.data && Array.isArray(response.data)) {
          this.cuentasBancarias = response.data.map((cuenta: any) => ({
            id: cuenta.id,
            numero_cuenta: cuenta.numero_cuenta,
            nombre_banco: cuenta.nombre_banco,
            saldo: cuenta.saldo || 0,
            limite: cuenta.limite || 0,
            tipo_moneda: cuenta.tipo_moneda?.id || 1,
            titular_cuenta: cuenta.titular_cuenta
          }));
          console.log('PaymentFormComponent - Cuentas bancarias cargadas:', this.cuentasBancarias);
          // Mostrar todas las cuentas por defecto hasta que se seleccione tipo de moneda
          this.cuentasBancariasFiltradas = this.cuentasBancarias;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('PaymentFormComponent - Error cargando cuentas bancarias:', error);
        this.cuentasBancarias = [];
        this.cuentasBancariasFiltradas = [];
      }
    });
  }

  /**
   * Mostrar todos los clientes al hacer focus
   */
  onClienteFocus(): void {
    console.log('PaymentFormComponent - onClienteFocus() - Clientes disponibles:', this.clientes);
    this.filteredClientes = this.clientes;
    this.showClienteDropdown = this.clientes.length > 0;
    this.cdr.markForCheck();
  }

  /**
   * Filtrar clientes por búsqueda
   */
  onClienteSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length === 0) {
      // Si está vacío, mostrar todos los clientes
      this.filteredClientes = this.clientes;
    } else {
      // Si hay texto, filtrar
      this.filteredClientes = this.clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm)
      );
    }
    this.showClienteDropdown = this.filteredClientes.length > 0;
    this.cdr.markForCheck();
  }

  /**
   * Seleccionar cliente
   */
  selectCliente(cliente: Cliente): void {
    this.paymentForm.patchValue({
      clienteId: cliente.id,
      clienteNombre: cliente.nombre
    });
    this.showClienteDropdown = false;
    this.cdr.markForCheck();
  }

  /**
   * Mostrar todos los proveedores al hacer focus
   */
  onProveedorFocus(): void {
    console.log('PaymentFormComponent - onProveedorFocus() - Proveedores disponibles:', this.proveedores);
    this.filteredProveedores = this.proveedores;
    this.showProveedorDropdown = this.proveedores.length > 0;
    this.cdr.markForCheck();
  }

  /**
   * Filtrar proveedores por búsqueda
   */
  onProveedorSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length === 0) {
      // Si está vacío, mostrar todos los proveedores
      this.filteredProveedores = this.proveedores;
    } else {
      // Si hay texto, filtrar
      this.filteredProveedores = this.proveedores.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm)
      );
    }
    this.showProveedorDropdown = this.filteredProveedores.length > 0;
    this.cdr.markForCheck();
  }

  /**
   * Seleccionar proveedor
   */
  selectProveedor(proveedor: Proveedor): void {
    this.paymentForm.patchValue({
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.nombre,
      correo: proveedor.correo || ''
    });
    this.showProveedorDropdown = false;
    this.cdr.markForCheck();
  }

  /**
   * Obtener información de la cuenta bancaria seleccionada
   */
  getCuentaBancariaInfo(): CuentaBancaria | undefined {
    const cuentaId = this.paymentForm.get('cuentaBancariaId')?.value;
    return this.cuentasBancarias.find(c => c.id === cuentaId);
  }

  /**
   * Validar que el monto no exceda el saldo
   */
  validateMonto(): boolean {
    const monto = this.paymentForm.get('monto')?.value;
    const cuenta = this.getCuentaBancariaInfo();
    
    if (!cuenta) return false;
    if (!monto) return false;
    
    return monto <= cuenta.saldo;
  }

  setNumeroPrestaModo(automatico: boolean): void {
    this.numeroPrestaAutomatico = automatico;
    this.numeroPrestaError = null;

    const control = this.paymentForm.get('numeroPresta');
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

    this.cdr.markForCheck();
  }

  private generarNumeroPrestaAutomatico(): void {
    const control = this.paymentForm.get('numeroPresta');
    if (!control) {
      return;
    }

    this.pagoBancarioService.getAll('todos', 'todos').subscribe({
      next: (response) => {
        let nextId = 1;

        if (response && response.data && Array.isArray(response.data)) {
          const ids = (response.data as any[])
            .map((pago: any) => pago.id)
            .filter((id: any) => typeof id === 'number');

          if (ids.length > 0) {
            const maxId = Math.max(...ids);
            nextId = maxId + 1;
          }
        }

        const codigo = `BANCO-${this.currentYear}-${nextId}`;

        control.setValue(codigo);
        control.markAsDirty();
        control.updateValueAndValidity();

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('PaymentFormComponent - Error generando N° Présta automático:', error);
        this.numeroPrestaError = 'No se pudo generar el N° Présta automático';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Enviar formulario
   */
  onSubmitForm(): void {
    if (!this.paymentForm.valid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = {
      clienteId: this.paymentForm.get('clienteId')?.value,
      proveedorId: this.paymentForm.get('proveedorId')?.value,
      correoProveedor: this.paymentForm.get('correo')?.value,
      cuentaBancariaId: this.paymentForm.get('cuentaBancariaId')?.value,
      monto: this.paymentForm.get('monto')?.value,
      numeroPresta: this.paymentForm.get('numeroPresta')?.value,
      comentarios: this.paymentForm.get('comentarios')?.value
    };

    console.log('PaymentFormComponent.onSubmitForm() - Enviando datos:', formData);

    this.pagoBancarioService.create(formData).subscribe({
      next: (response) => {
        console.log('PaymentFormComponent.onSubmitForm() - Respuesta exitosa:', response);
        this.isSubmitting = false;
        this.paymentForm.reset();
        // Notificación unificada
        this.notificationService.success('✅ Pago bancario registrado exitosamente');
        this.onSubmit.emit(response);
        this.onCancelForm();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('PaymentFormComponent.onSubmitForm() - Error:', error);
        console.error('PaymentFormComponent.onSubmitForm() - Status:', error?.status);
        console.error('PaymentFormComponent.onSubmitForm() - Message:', error?.error?.message);
        this.errorMessage = error?.error?.message || 'Error al crear el pago bancario';
        this.notificationService.error(this.errorMessage || 'Error al crear el pago bancario');
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Cancelar formulario
   */
  onCancelForm(): void {
    this.paymentForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
    this.onCancel.emit();
  }

  /**
   * Obtener mensaje de error para campo
   */
  getFieldError(fieldName: string): string | null {
    const field = this.paymentForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} es requerido`;
    }
    if (field?.hasError('min')) {
      return `${fieldName} debe ser mayor a 0`;
    }
    return null;
  }

  /**
   * Abrir modal para agregar nuevo cliente
   */
  abrirModalNuevoCliente(): void {
    this.mostrarModalNuevoCliente = true;
    this.nuevoClienteNombre = '';
    this.nuevoClienteUbicacion = '';
    this.nuevoClienteTelefono = '';
    this.nuevoClienteCorreo = '';
    this.cdr.markForCheck();
  }

  /**
   * Cerrar modal de nuevo cliente
   */
  cerrarModalNuevoCliente(): void {
    this.mostrarModalNuevoCliente = false;
    this.cdr.markForCheck();
  }

  /**
   * Guardar nuevo cliente
   */
  guardarNuevoCliente(): void {
    if (!this.nuevoClienteNombre.trim()) {
      this.errorMessage = 'El nombre del cliente es requerido';
      this.cdr.markForCheck();
      return;
    }

    const nuevoCliente = {
      nombre: this.nuevoClienteNombre,
      ubicacion: this.nuevoClienteUbicacion,
      telefono: this.nuevoClienteTelefono,
      correo: this.nuevoClienteCorreo
    };

    this.clienteService.create(nuevoCliente).subscribe({
      next: (response: any) => {
        console.log('Nuevo cliente creado:', response);
        this.successMessage = 'Cliente creado exitosamente';
        this.cerrarModalNuevoCliente();
        this.loadClientes();
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (error) => {
        console.error('Error creando cliente:', error);
        this.errorMessage = 'Error al crear el cliente';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Abrir modal para agregar nuevo proveedor
   */
  abrirModalNuevoProveedor(): void {
    this.mostrarModalNuevoProveedor = true;
    this.nuevoProveedorNombre = '';
    this.nuevoProveedorServicio = '';
    this.nuevoProveedorTelefono = '';
    this.nuevoProveedorTelefono2 = '';
    this.nuevoProveedorCorreo = '';
    this.nuevoProveedorCorreo2 = '';
    this.nuevoProveedorDescripcion = '';
    this.cdr.markForCheck();
  }

  /**
   * Cerrar modal de nuevo proveedor
   */
  cerrarModalNuevoProveedor(): void {
    this.mostrarModalNuevoProveedor = false;
    this.cdr.markForCheck();
  }

  /**
   * Guardar nuevo proveedor
   */
  guardarNuevoProveedor(): void {
    if (!this.nuevoProveedorNombre.trim() || !this.nuevoProveedorServicio.trim()) {
      this.errorMessage = 'El nombre y servicio del proveedor son requeridos';
      this.cdr.markForCheck();
      return;
    }

    const nuevoProveedor = {
      nombre: this.nuevoProveedorNombre,
      servicio: this.nuevoProveedorServicio,
      telefono: this.nuevoProveedorTelefono,
      telefono2: this.nuevoProveedorTelefono2,
      correo: this.nuevoProveedorCorreo,
      correo2: this.nuevoProveedorCorreo2,
      descripcion: this.nuevoProveedorDescripcion
    };

    this.proveedorService.create(nuevoProveedor).subscribe({
      next: (response: any) => {
        console.log('Nuevo proveedor creado:', response);
        this.successMessage = 'Proveedor creado exitosamente';
        this.cerrarModalNuevoProveedor();
        this.loadProveedores();
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (error) => {
        console.error('Error creando proveedor:', error);
        this.errorMessage = 'Error al crear el proveedor';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Manejar cambio de moneda
   */
  onMonedaChange(): void {
    const tipoMonedaId = this.paymentForm.get('tipoMoneda')?.value;
    if (tipoMonedaId) {
      this.filtrarCuentasPorMoneda(tipoMonedaId);
    } else {
      this.cuentasBancariasFiltradas = [];
    }
    this.paymentForm.get('cuentaBancariaId')?.reset();
    this.cdr.markForCheck();
  }
}
