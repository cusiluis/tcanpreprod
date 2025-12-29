import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Subscription } from 'rxjs';
import { TranslationKey } from '../models/translations.model';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription?: Subscription;
  private lastKey?: TranslationKey;
  private lastValue: string = '';

  constructor(
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  transform(key: TranslationKey): string {
    if (this.lastKey !== key) {
      this.lastKey = key;
      this.lastValue = this.translationService.translate(key);

      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      this.subscription = this.translationService.currentLanguage$.subscribe(() => {
        this.lastValue = this.translationService.translate(key);
        this.cdr.markForCheck();
      });
    }

    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
