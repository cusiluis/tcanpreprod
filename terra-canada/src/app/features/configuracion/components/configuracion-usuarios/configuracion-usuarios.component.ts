import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UsuarioService, Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from '../../../../core/services/usuario.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

interface UsuarioView {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  correo: string;
  telefono?: string;
  rolNombre: string;
  esta_activo: boolean;
  fecha_creacion: string;
}

@Component({
  selector: 'app-configuracion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './configuracion-usuarios.component.html',
  styleUrl: './configuracion-usuarios.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionUsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioView[] = [];
  filteredUsuarios: UsuarioView[] = [];
  searchTerm: string = '';
  isLoading = false;
  errorMessage: string | null = null;

  showCreateModal = false;
  showEditModal = false;
  selectedUsuario: Usuario | null = null;

  showDeleteConfirm = false;
  usuarioAEliminar: UsuarioView | null = null;

  nuevoUsuario: CreateUsuarioPayload = {
    nombre_usuario: '',
    correo: '',
    contrasena: '',
    nombre_completo: '',
    rol_id: 2,
    telefono: ''
  };

  editarUsuarioForm: UpdateUsuarioPayload & { id?: number } = {
    id: undefined,
    nombre_usuario: '',
    correo: '',
    nombre_completo: '',
    telefono: '',
    rol_id: 2,
    esta_activo: true
  };

  roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Equipo' }
  ];

  canManageUsers = false;

  private destroy$ = new Subject<void>();

  showPassword = false;

  // Cambio de contraseña desde Gestión de Usuarios (solo administradores)
  showChangePasswordModal = false;
  usuarioCambioContrasena: UsuarioView | null = null;

  passwordChangeForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  isChangingPassword = false;
  showCurrentPasswordChange = false;
  showNewPasswordChange = false;
  showConfirmPasswordChange = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.canManageUsers = this.authService.isAdmin();
    this.configurarSuscripcionUsuarios();
    this.usuarioService.cargarUsuarios(1, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarSuscripcionUsuarios(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.usuarioService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendUsuarios: Usuario[]) => {
          // Solo mostrar usuarios activos en la tabla de Gestión de Usuarios
          this.usuarios = (backendUsuarios || [])
            .map((u: Usuario) => this.mapUsuarioToView(u))
            .filter((u: UsuarioView) => u.esta_activo);
          this.filteredUsuarios = [...this.usuarios];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error en flujo de usuarios:', error);
          this.errorMessage =
            error?.error?.error?.message || error?.message || 'Error cargando usuarios';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private mapUsuarioToView(usuario: Usuario): UsuarioView {
    const rol = (usuario as any).rol || (usuario as any).Role;
    const rolNombre = rol?.nombre || usuario.rol_nombre || '';

    return {
      id: usuario.id,
      nombre_usuario: usuario.nombre_usuario,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rolNombre,
      esta_activo: usuario.esta_activo,
      fecha_creacion: usuario.fecha_creacion
        ? new Date(usuario.fecha_creacion).toLocaleString()
        : ''
    };
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsuarios = [...this.usuarios];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsuarios = this.usuarios.filter((u) =>
      u.nombre_usuario.toLowerCase().includes(term) ||
      u.nombre_completo.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      (u.telefono || '').toLowerCase().includes(term) ||
      u.rolNombre.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredUsuarios = [...this.usuarios];
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onTelefonoInputNuevo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloNumeros = (input.value || '').replace(/\D/g, '');
    input.value = soloNumeros;
    this.nuevoUsuario.telefono = soloNumeros;
  }

  onTelefonoInputEditar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloNumeros = (input.value || '').replace(/\D/g, '');
    input.value = soloNumeros;
    this.editarUsuarioForm.telefono = soloNumeros;
  }

  abrirModalCrear(): void {
    this.nuevoUsuario = {
      nombre_usuario: '',
      correo: '',
      contrasena: '',
      nombre_completo: '',
      rol_id: 2,
      telefono: ''
    };
    this.showCreateModal = true;
  }

  cerrarModalCrear(): void {
    this.showCreateModal = false;
  }

  onCrearUsuario(): void {
    if (!this.nuevoUsuario.nombre_usuario || !this.nuevoUsuario.correo || !this.nuevoUsuario.contrasena || !this.nuevoUsuario.nombre_completo) {
      this.notificationService.error('❌ Completa los campos obligatorios para crear el usuario');
      return;
    }

    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: (usuario) => {
        console.log('Usuario creado:', usuario);
        this.showCreateModal = false;
        const msg = 'Usuario creado correctamente';
        this.notificationService.success(`✅ ${msg}`);
        this.usuarioService.recargarUsuarios();
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        const msg =
          error?.error?.error?.message || error?.message || 'Error creando usuario';
        this.errorMessage = msg;
        this.notificationService.error(`❌ ${msg}`);
      }
    });
  }

  abrirModalEditar(usuarioView: UsuarioView): void {
    const original = this.usuarios.find((u) => u.id === usuarioView.id);
    if (!original) {
      return;
    }

    this.editarUsuarioForm = {
      id: original.id,
      nombre_usuario: original.nombre_usuario,
      correo: original.correo,
      nombre_completo: original.nombre_completo,
      telefono: original.telefono,
      rol_id: this.roles.find((r) => r.nombre === original.rolNombre)?.id || 2,
      esta_activo: original.esta_activo
    };

    this.showEditModal = true;
  }

  cerrarModalEditar(): void {
    this.showEditModal = false;
    this.selectedUsuario = null;
  }

  onEditarUsuario(): void {
    if (!this.editarUsuarioForm.id) {
      return;
    }

    if (!this.editarUsuarioForm.nombre_usuario || !this.editarUsuarioForm.correo || !this.editarUsuarioForm.nombre_completo) {
      this.notificationService.error('❌ Completa los campos obligatorios para editar el usuario');
      return;
    }

    const payload: UpdateUsuarioPayload = {
      nombre_usuario: this.editarUsuarioForm.nombre_usuario,
      correo: this.editarUsuarioForm.correo,
      nombre_completo: this.editarUsuarioForm.nombre_completo,
      telefono: this.editarUsuarioForm.telefono,
      rol_id: this.editarUsuarioForm.rol_id,
      esta_activo: this.editarUsuarioForm.esta_activo
    };

    this.usuarioService.actualizarUsuario(this.editarUsuarioForm.id, payload).subscribe({
      next: (usuario) => {
        console.log('Usuario actualizado:', usuario);
        this.showEditModal = false;
        const msg = 'Usuario actualizado correctamente';
        this.notificationService.success(`✅ ${msg}`);
        this.usuarioService.recargarUsuarios();
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        const msg =
          error?.error?.error?.message || error?.message || 'Error actualizando usuario';
        this.errorMessage = msg;
        this.notificationService.error(`❌ ${msg}`);
      }
    });
  }

  onToggleActivo(usuario: UsuarioView): void {
    // En Gestión de Usuarios solo permitimos desactivar usuarios (no eliminarlos físicamente)
    if (!usuario.esta_activo) {
      return;
    }

    this.usuarioService.desactivarUsuario(usuario.id).subscribe({
      next: () => {
        console.log('Usuario desactivado');
        const msg = 'Usuario eliminado correctamente';
        this.notificationService.success(`✅ ${msg}`);
        this.usuarioService.recargarUsuarios();
      },
      error: (error) => {
        console.error('Error desactivando usuario:', error);
        const msg =
          error?.error?.error?.message || error?.message || 'Error desactivando usuario';
        this.errorMessage = msg;
        this.notificationService.error(`❌ ${msg}`);
      }
    });
  }

  abrirModalEliminar(usuario: UsuarioView): void {
    this.usuarioAEliminar = usuario;
    this.showDeleteConfirm = true;
  }

  cerrarModalEliminar(): void {
    this.showDeleteConfirm = false;
    this.usuarioAEliminar = null;
  }

  confirmarEliminarUsuario(): void {
    if (!this.usuarioAEliminar) {
      return;
    }

    this.onToggleActivo(this.usuarioAEliminar);
    this.cerrarModalEliminar();
  }

  onCambiarContrasena(usuario: UsuarioView): void {
    this.usuarioCambioContrasena = usuario;
    this.passwordChangeForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.isChangingPassword = false;
    this.showCurrentPasswordChange = false;
    this.showNewPasswordChange = false;
    this.showConfirmPasswordChange = false;
    this.showChangePasswordModal = true;
  }

  cerrarModalCambioContrasena(): void {
    this.showChangePasswordModal = false;
    this.usuarioCambioContrasena = null;
    this.passwordChangeForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.isChangingPassword = false;
    this.showCurrentPasswordChange = false;
    this.showNewPasswordChange = false;
    this.showConfirmPasswordChange = false;
  }

  togglePasswordVisibilityCambio(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPasswordChange = !this.showCurrentPasswordChange;
    } else if (field === 'new') {
      this.showNewPasswordChange = !this.showNewPasswordChange;
    } else if (field === 'confirm') {
      this.showConfirmPasswordChange = !this.showConfirmPasswordChange;
    }
  }

  private validatePasswordChangeForm(): boolean {
    if (!this.passwordChangeForm.currentPassword) {
      this.notificationService.error('❌ Ingresa la contraseña actual');
      return false;
    }
    if (!this.passwordChangeForm.newPassword) {
      this.notificationService.error('❌ Ingresa una nueva contraseña');
      return false;
    }
    if (this.passwordChangeForm.newPassword.length < 8) {
      this.notificationService.error('❌ La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (this.passwordChangeForm.newPassword !== this.passwordChangeForm.confirmPassword) {
      this.notificationService.error('❌ Las contraseñas no coinciden');
      return false;
    }
    if (this.passwordChangeForm.currentPassword === this.passwordChangeForm.newPassword) {
      this.notificationService.error('❌ La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    return true;
  }

  confirmarCambioContrasena(): void {
    if (!this.usuarioCambioContrasena) {
      return;
    }

    if (this.isChangingPassword) {
      return;
    }

    if (!this.validatePasswordChangeForm()) {
      return;
    }

    this.isChangingPassword = true;
    this.cdr.markForCheck();

    this.usuarioService
      .cambiarContrasena(
        this.usuarioCambioContrasena.id,
        this.passwordChangeForm.currentPassword,
        this.passwordChangeForm.newPassword
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isChangingPassword = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          const msg = 'Contraseña actualizada correctamente';
          this.notificationService.success(`✅ ${msg}`);
          this.cerrarModalCambioContrasena();
        },
        error: (error) => {
          console.error('Error cambiando contraseña de usuario desde Gestión:', error);
          const msg =
            error?.error?.error?.message ||
            error?.message ||
            'Error cambiando contraseña';
          this.notificationService.error(`❌ ${msg}`);
        }
      });
  }
}
