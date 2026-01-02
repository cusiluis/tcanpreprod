import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AiChatComponent } from './shared/components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AiChatComponent],
  template: `
    <router-outlet></router-outlet>
    <app-ai-chat *ngIf="(isAuthenticated$ | async) && !isLoginRoute"></app-ai-chat>
  `,
  styleUrl: './app.scss'
})
export class App {
  isAuthenticated$: Observable<boolean>;
  isLoginRoute = false;

  constructor(private authService: AuthService, private router: Router) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.updateIsLoginRoute(this.router.url);

    this.router.events
      .pipe(filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects ?? event.url;
        this.updateIsLoginRoute(currentUrl);
      });
  }

  private updateIsLoginRoute(url: string): void {
    // Normalizar removiendo query params y fragmentos
    const normalized = url.split('?')[0].split('#')[0];
    this.isLoginRoute =
      normalized === '/login' ||
      normalized === 'login' ||
      normalized.startsWith('/login') ||
      normalized.startsWith('/auth/login');
  }
}
