import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router } from '@angular/router';
import { finalize, take, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-configuracion-seguridad',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './configuracion-seguridad.component.html',
  styleUrl: './configuracion-seguridad.component.scss'
})
export class ConfiguracionSeguridadComponent implements OnInit {
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isChanging: boolean = false;
  passwordStrength: number = 0;
  passwordStrengthLabel: string = '';

  // Modal para forzar re-login tras cambio de contraseña
  showReLoginModal: boolean = false;

  securityInfo = {
    lastPasswordChange: '2024-01-15',
    lastLogin: '2024-01-20 14:30',
    loginAttempts: 0,
    twoFactorEnabled: true,
    sessionTimeout: 30
  };

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize
  }

  aceptarReLogin(): void {
    this.showReLoginModal = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onNewPasswordChange(): void {
    this.calculatePasswordStrength(this.passwordForm.newPassword);
  }

  calculatePasswordStrength(password: string): void {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    this.passwordStrength = Math.min(strength, 5);

    const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    this.passwordStrengthLabel = labels[this.passwordStrength];
  }

  changePassword(): void {
    if (this.isChanging) {
      return;
    }

    if (!this.validatePasswordForm()) {
      return;
    }

    this.isChanging = true;
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('No se pudo obtener el usuario actual para cambiar la contraseña');
      this.isChanging = false;
      return;
    }

    console.log('ConfiguracionSeguridadComponent.changePassword() - iniciando petición');
    this.usuarioService
      .cambiarContrasena(
        Number(currentUser.id),
        this.passwordForm.currentPassword,
        this.passwordForm.newPassword
      )
      .pipe(
        take(1),
        timeout(15000),
        finalize(() => { 
          this.isChanging = false; 
          console.log('ConfiguracionSeguridadComponent.changePassword() - finalize ejecutado');
        })
      )
      .subscribe({
        next: () => {
          this.resetPasswordForm();
          console.log('Contraseña cambiada exitosamente');
          this.notificationService.success('✅ Contraseña cambiada correctamente');
          this.showReLoginModal = true;

          // Actualizar fecha de último cambio de contraseña en la tarjeta de información
          const now = new Date();
          this.securityInfo.lastPasswordChange = now.toISOString().split('T')[0];
        },
        error: (error) => {
          console.error('Error cambiando contraseña:', error);
          this.notificationService.error('❌ Error cambiando contraseña');
        }
      });
  }

  validatePasswordForm(): boolean {
    if (!this.passwordForm.currentPassword) {
      console.error('Ingresa tu contraseña actual');
      return false;
    }
    if (!this.passwordForm.newPassword) {
      console.error('Ingresa una nueva contraseña');
      return false;
    }
    if (this.passwordForm.newPassword.length < 8) {
      console.error('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      console.error('Las contraseñas no coinciden');
      return false;
    }
    if (this.passwordForm.currentPassword === this.passwordForm.newPassword) {
      console.error('La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    return true;
  }

  resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordStrength = 0;
    this.passwordStrengthLabel = '';
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  getPasswordStrengthColor(): string {
    const colors = ['', '#ff6b6b', '#ffa500', '#ffd700', '#90ee90', '#2d7a7a'];
    return colors[this.passwordStrength];
  }
}
