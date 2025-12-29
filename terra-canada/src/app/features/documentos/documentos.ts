import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopHeaderComponent } from '../../shared/components/top-header/top-header';
import { DocumentosListComponent } from './components/documentos-list/documentos-list.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopHeaderComponent,
    DocumentosListComponent,
    TranslatePipe
  ],
  templateUrl: './documentos.html',
  styleUrl: './documentos.scss'
})
export class DocumentosComponent implements OnInit {
  selectedDateFilter: string = '';
  searchTerm: string = '';
  
  ngOnInit(): void {
    // Initialization logic
  }

  onDateFilterChange(): void {
    // Handle date filter change
  }

  clearDateFilter(): void {
    this.selectedDateFilter = '';
  }
}
