import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/auth.model';
import { UsuarioService, Usuario, UpdateUsuarioPayload } from '../../../../core/services/usuario.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-configuracion-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './configuracion-perfil.component.html',
  styleUrl: './configuracion-perfil.component.scss'
})
export class ConfiguracionPerfilComponent implements OnInit {
  profileForm = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    username: '',
    rol: ''
  };

  isEditing: boolean = false;
  isSaving: boolean = false;

  currentUser: User | null = null;
  usuarioDetalle: Usuario | null = null;
  avatarDataUrl: string | null = null;
  isAdminUser = false;
  isEquipoUser = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Intentar obtener inmediatamente el usuario actual (por si ya está en memoria/localStorage)
    const directUser = this.authService.getCurrentUser();
    if (directUser) {
      this.initializeFromUser(directUser);
      this.cdr.detectChanges();
    }

    // Suscribirse para cubrir el caso en que el usuario se establezca o cambie después
    this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.currentUser = null;
        return;
      }

      // Si ya inicializamos con este mismo usuario, no repetir
      if (this.currentUser && this.currentUser.id === user.id) {
        return;
      }

      this.initializeFromUser(user);
      this.cdr.detectChanges();
    });
  }

  private initializeFromUser(user: User): void {
    this.currentUser = user;
    this.isAdminUser = this.authService.isAdmin();
    this.isEquipoUser = this.authService.isEquipo();

    const fullName = user.nombre_completo || '';
    const parts = fullName.split(' ');
    const nombre = parts.shift() || user.username;
    const apellido = parts.join(' ');

    this.profileForm.nombre = nombre;
    this.profileForm.apellido = apellido;
    this.profileForm.email = user.email;
    this.profileForm.username = user.username;
    this.profileForm.rol = user.rol_nombre;

    // Cargar datos adicionales del usuario desde el backend (teléfono, estado, etc.)
    const idNum = Number(user.id);
    if (!Number.isNaN(idNum)) {
      this.usuarioService.getUsuarioById(idNum).subscribe({
        next: (usuario) => {
          this.usuarioDetalle = usuario;
          this.profileForm.telefono = usuario.telefono || '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('ConfiguracionPerfilComponent - Error cargando usuario por ID:', error);
        }
      });
    }

    // Cargar avatar asociado a este usuario
    this.loadAvatar();
  }

  toggleEdit(): void {
    if (!this.isAdminUser) {
      return;
    }
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (!this.isAdminUser || !this.currentUser) {
      return;
    }

    if (this.isSaving) {
      return;
    }

    const idNum = Number(this.currentUser.id);
    if (Number.isNaN(idNum)) {
      return;
    }

    const nombre = (this.profileForm.nombre || '').trim();
    const apellido = (this.profileForm.apellido || '').trim();
    const nombreCompleto = `${nombre} ${apellido}`.trim().replace(/\s+/g, ' ');

    const payload: UpdateUsuarioPayload = {
      nombre_completo: nombreCompleto,
      telefono: this.profileForm.telefono || undefined
    };

    this.isSaving = true;

    this.usuarioService.actualizarUsuario(idNum, payload).subscribe({
      next: (usuarioActualizado: Usuario) => {
        this.isSaving = false;
        this.isEditing = false;

        this.usuarioDetalle = usuarioActualizado;

        const backendNombreCompleto = usuarioActualizado?.nombre_completo || nombreCompleto;
        const parts = backendNombreCompleto.split(' ');
        this.profileForm.nombre = parts.shift() || this.profileForm.nombre;
        this.profileForm.apellido = parts.join(' ');
        this.profileForm.telefono = usuarioActualizado?.telefono || this.profileForm.telefono;

        // Actualizar también el usuario actual en AuthService/localStorage
        if (this.currentUser) {
          const updatedUser: User = {
            ...this.currentUser,
            nombre_completo: backendNombreCompleto
          };
          this.authService.updateStoredUser(updatedUser);
          this.currentUser = updatedUser;
        }

        const msg = 'Perfil actualizado correctamente';
        setTimeout(() => {
          this.notificationService.success(`✅ ${msg}`);
        }, 0);
      },
      error: (error) => {
        console.error('ConfiguracionPerfilComponent - Error actualizando perfil:', error);
        this.isSaving = false;

        const msg =
          error?.error?.error?.message ||
          error?.message ||
          'Error actualizando perfil';
        setTimeout(() => {
          this.notificationService.error(`❌ ${msg}`);
        }, 0);
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;

    // Restaurar los valores del formulario a los datos persistidos
    if (this.currentUser) {
      const fullName = this.currentUser.nombre_completo || '';
      const parts = fullName.split(' ');
      this.profileForm.nombre = parts.shift() || this.currentUser.username;
      this.profileForm.apellido = parts.join(' ');
      this.profileForm.email = this.currentUser.email;
      this.profileForm.username = this.currentUser.username;
      this.profileForm.rol = this.currentUser.rol_nombre;
    }

    if (this.usuarioDetalle) {
      this.profileForm.telefono = this.usuarioDetalle.telefono || '';
    } else {
      this.profileForm.telefono = '';
    }
  }

  private loadAvatar(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (!this.currentUser) {
      return;
    }
    const key = `profile_avatar_${this.currentUser.id}`;
    const stored = localStorage.getItem(key);
    this.avatarDataUrl = stored;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarDataUrl = result;

      if (typeof localStorage !== 'undefined' && this.currentUser) {
        const key = `profile_avatar_${this.currentUser.id}`;
        localStorage.setItem(key, result);
      }
    };
    reader.readAsDataURL(file);
  }
}
