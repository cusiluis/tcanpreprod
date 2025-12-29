import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { TranslationKey } from '../../models/translations.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './top-header.html',
  styleUrl: './top-header.scss',
})
export class TopHeaderComponent implements OnInit, OnDestroy {
  language: Language = 'es';
  isFullscreen: boolean = false;
  showLanguageMenu: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private themeService: ThemeService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.translationService.currentLanguage$.subscribe((language) => {
        this.language = language;
      })
    );

    this.subscriptions.push(
      this.themeService.isFullscreen$.subscribe((isFullscreen) => {
        this.isFullscreen = isFullscreen;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleFullscreen(): void {
    this.themeService.toggleFullscreen();
  }

  toggleLanguageMenu(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  selectLanguage(lang: Language): void {
    this.translationService.setLanguage(lang);
    this.showLanguageMenu = false;
  }

  getTranslation(key: TranslationKey): string {
    return this.translationService.translate(key);
  }

  closeMenus(): void {
    this.showLanguageMenu = false;
  }
}
