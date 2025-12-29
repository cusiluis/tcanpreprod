import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCard as StatCardModel } from '../../models/dashboard.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationKey } from '../../models/translations.model';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCardComponent {
  @Input() stat!: StatCardModel;

  getTranslatedTitle(id: string): TranslationKey {
    const titleMap: { [key: string]: TranslationKey } = {
      'usuarios': 'usuariosActivos',
      'pagos-pendientes': 'transaccionesHoy',
      'tarjetas': 'habitadasExito',
      'eficiencia': 'eficiencia',
      'pagos-estado-pagado': 'pagosEstadoPagado',
      'pagos-verificados': 'pagosVerificados',
      'emails-espera-envio': 'emailsEsperaEnvio',
      'emails-enviados': 'emailsEnviados'
    };
    return titleMap[id] || ('eficiencia' as TranslationKey);
  }
}
