import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TarjetaService, Tarjeta } from '../../../../core/services/tarjeta.service';
import { NotificationService } from '../../../../core/services/notification.service';

/**
 * TarjetasFormComponent
 * Formulario para crear tarjetas y añadir saldo
 * 
 * Funcionalidades:
 * - Crear nueva tarjeta con nombre y tipo de tarjeta
 * - Añadir saldo a tarjeta existente
 * - Validación de campos
 * - Integración con TarjetaService
 */
@Component({
  selector: 'app-tarjetas-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './tarjetas-form.component.html',
  styleUrl: './tarjetas-form.component.scss'
})
export class TarjetasFormComponent implements OnInit {
  @Input() actionType: string = '';
  @Input() tarjetaSeleccionada: Tarjeta | null = null;
  @Output() onSubmit = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  // Nueva Tarjeta Form - Basado en estructura real de BD
  nuevaTarjetaForm = {
    nombre_titular: '',
    numero_tarjeta: '',
    limite: 0,
    tipo_tarjeta_id: 1
  };

  // Realizar Cargo Form
  realizarCargoForm = {
    monto: 0
  };

  // Realizar Pago Form
  realizarPagoForm = {
    monto: 0
  };

  // Tipos de tarjeta disponibles (Monedas)
  tiposTarjeta = [
    { id: 1, nombre: 'USD' },
    { id: 2, nombre: 'CAD' }
  ];

  // Estado del formulario
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private tarjetaService: TarjetaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Si es formulario de añadir saldo, cargar datos de tarjeta seleccionada
    if (this.actionType === 'recargar-saldo' && this.tarjetaSeleccionada) {
      console.log('Tarjeta seleccionada:', this.tarjetaSeleccionada);
    }
  }

  /**
   * Maneja el evento de input del número de tarjeta
   * Formatea automáticamente cada 4 dígitos con espacios
   * Solo permite números
   * Máximo 16 dígitos (19 caracteres con espacios)
   */
  onNumeroTarjetaInput(event: any): void {
    let valor = event.target.value;

    // Eliminar todos los espacios
    let soloNumeros = valor.replace(/\s/g, '');

    // Solo permitir números
    soloNumeros = soloNumeros.replace(/\D/g, '');

    // Limitar a 16 dígitos
    if (soloNumeros.length > 16) {
      soloNumeros = soloNumeros.substring(0, 16);
    }

    // Formatear cada 4 dígitos con espacios
    let numeroFormateado = '';
    for (let i = 0; i < soloNumeros.length; i++) {
      if (i > 0 && i % 4 === 0) {
        numeroFormateado += ' ';
      }
      numeroFormateado += soloNumeros[i];
    }

    // Actualizar el valor en el formulario
    this.nuevaTarjetaForm.numero_tarjeta = numeroFormateado;
    event.target.value = numeroFormateado;
  }

  /**
   * Enviar formulario según el tipo de acción
   */
  submitForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.actionType === 'nueva-tarjeta') {
      this.submitNuevaTarjeta();
    } else if (this.actionType === 'recargar-saldo') {
      this.submitAnadirSaldo();
    }
  }

  /**
   * Crear nueva tarjeta
   */
  submitNuevaTarjeta(): void {
    // Validar campos requeridos
    if (!this.nuevaTarjetaForm.nombre_titular.trim()) {
      this.notificationService.error('El nombre del titular es requerido');
      return;
    }

    if (!this.nuevaTarjetaForm.numero_tarjeta.trim()) {
      this.notificationService.error('El número de tarjeta es requerido');
      return;
    }

    // Validar formato del número de tarjeta
    const numeroTarjeta = this.nuevaTarjetaForm.numero_tarjeta.replace(/\s/g, '');
    if (!/^\d{16}$/.test(numeroTarjeta)) {
      this.notificationService.error('El número de tarjeta debe contener exactamente 16 dígitos');
      return;
    }

    if (!this.nuevaTarjetaForm.limite || this.nuevaTarjetaForm.limite <= 0) {
      this.notificationService.error('El límite debe ser un valor positivo');
      return;
    }

    if (!this.nuevaTarjetaForm.tipo_tarjeta_id) {
      this.notificationService.error('El tipo de tarjeta es requerido');
      return;
    }

    this.isLoading = true;

    this.tarjetaService.create({
      nombre_titular: this.nuevaTarjetaForm.nombre_titular,
      numero_tarjeta: this.nuevaTarjetaForm.numero_tarjeta,
      limite: this.nuevaTarjetaForm.limite,
      tipo_tarjeta_id: this.nuevaTarjetaForm.tipo_tarjeta_id
    }).subscribe(
      (response: any) => {
        this.isLoading = false;
        console.log('Tarjeta creada:', response);
        
        // Resetear formulario
        this.resetNuevaTarjetaForm();
        
        // Emitir evento de éxito
        this.onSubmit.emit();
      },
      (error: any) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Error al crear la tarjeta';
        this.notificationService.error(errorMsg);
        console.error('Error creando tarjeta:', error);
      }
    );
  }

  /**
   * Realizar cargo a tarjeta (aumentar saldo)
   */
  submitAnadirSaldo(): void {
    // Validar campos requeridos
    if (!this.tarjetaSeleccionada || !this.tarjetaSeleccionada.id) {
      this.notificationService.error('Debe seleccionar una tarjeta');
      return;
    }

    if (!this.realizarCargoForm.monto || this.realizarCargoForm.monto <= 0) {
      this.notificationService.error('El monto debe ser un valor positivo');
      return;
    }

    this.isLoading = true;

    this.tarjetaService.realizarCargo(this.tarjetaSeleccionada.id, { monto: this.realizarCargoForm.monto }).subscribe(
      (response: any) => {
        this.isLoading = false;
        console.log('Cargo realizado:', response);
        
        // Resetear formulario
        this.resetRealizarCargoForm();
        
        // Emitir evento de éxito
        this.onSubmit.emit();
      },
      (error: any) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Error al realizar cargo';
        this.notificationService.error(errorMsg);
        console.error('Error realizando cargo:', error);
      }
    );
  }

  /**
   * Cancelar formulario
   */
  cancel(): void {
    this.resetNuevaTarjetaForm();
    this.resetRealizarCargoForm();
    this.resetRealizarPagoForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.onCancel.emit();
  }

  /**
   * Resetear formulario de nueva tarjeta
   */
  private resetNuevaTarjetaForm(): void {
    this.nuevaTarjetaForm = {
      nombre_titular: '',
      numero_tarjeta: '',
      limite: 0,
      tipo_tarjeta_id: 1
    };
  }

  /**
   * Resetear formulario de realizar cargo
   */
  private resetRealizarCargoForm(): void {
    this.realizarCargoForm = {
      monto: 0
    };
  }

  /**
   * Resetear formulario de realizar pago
   */
  private resetRealizarPagoForm(): void {
    this.realizarPagoForm = {
      monto: 0
    };
  }

  /**
   * Obtener título del formulario
   */
  getFormTitle(): string {
    if (this.actionType === 'nueva-tarjeta') {
      return 'Añadir Nueva Tarjeta';
    } else if (this.actionType === 'recargar-saldo') {
      return 'Añadir Saldo';
    }
    return '';
  }

  /**
   * Obtener icono del formulario
   */
  getFormIcon(): string {
    if (this.actionType === 'nueva-tarjeta') {
      return 'pi-plus-circle';
    } else if (this.actionType === 'recargar-saldo') {
      return 'pi-wallet';
    }
    return '';
  }

  /**
   * Obtener nombre del tipo de tarjeta (moneda) seleccionado
   */
  getTipoTarjetaNombre(): string {
    const tipo = this.tiposTarjeta.find(t => t.id === this.nuevaTarjetaForm.tipo_tarjeta_id);
    return tipo ? tipo.nombre : 'USD';
  }

  /**
   * Validar número de tarjeta usando el algoritmo de Luhn
   * @param numeroTarjeta - Número de tarjeta sin espacios
   * @returns true si es válido, false si no
   */
  validarLuhn(numeroTarjeta: string): boolean {
    let suma = 0;
    let esDigitoDoble = false;

    // Recorrer de derecha a izquierda
    for (let i = numeroTarjeta.length - 1; i >= 0; i--) {
      let digito = parseInt(numeroTarjeta.charAt(i), 10);

      // Si es un dígito doble, multiplicar por 2
      if (esDigitoDoble) {
        digito *= 2;
        // Si el resultado es mayor a 9, restar 9
        if (digito > 9) {
          digito -= 9;
        }
      }

      suma += digito;
      esDigitoDoble = !esDigitoDoble;
    }

    // El número es válido si la suma es divisible por 10
    return suma % 10 === 0;
  }
}
