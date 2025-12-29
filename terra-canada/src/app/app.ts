import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatComponent } from './shared/components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChatComponent],
  template: `
    <router-outlet></router-outlet>
    <app-ai-chat></app-ai-chat>
  `,
  styleUrl: './app.scss'
})
export class App {}
