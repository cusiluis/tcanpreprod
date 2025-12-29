import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { EventosRegistroComponent } from './components/eventos-registro/eventos-registro.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopHeaderComponent,
    EventosRegistroComponent,
    TranslatePipe
  ],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss'
})
export class EventosComponent implements OnInit {
  ngOnInit(): void {
    // Initialization logic
  }
}
