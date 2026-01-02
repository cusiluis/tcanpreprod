import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TRANSLATIONS, TranslationKey } from '../../shared/models/translations.model';

export type Language = 'es' | 'en' | 'fr';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<Language>('fr');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    this.loadLanguage();
  }

  private loadLanguage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language | null;
      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.setLanguage(savedLanguage);
      }
    }
  }

  setLanguage(language: Language): void {
    if (this.isValidLanguage(language)) {
      this.currentLanguageSubject.next(language);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', language);
      }
      this.applyLanguageToDocument(language);
    }
  }

  getLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  getLanguage$(): Observable<Language> {
    return this.currentLanguage$;
  }

  translate(key: TranslationKey): string {
    const language = this.getLanguage();
    return TRANSLATIONS[language]?.[key] || key;
  }

  translate$(key: TranslationKey): Observable<string> {
    return new Observable(observer => {
      observer.next(this.translate(key));
      this.currentLanguage$.subscribe(() => {
        observer.next(this.translate(key));
      });
    });
  }

  getTranslations(): typeof TRANSLATIONS[Language] {
    const language = this.getLanguage();
    return TRANSLATIONS[language];
  }

  private isValidLanguage(language: any): language is Language {
    return ['es', 'en', 'fr'].includes(language);
  }

  private applyLanguageToDocument(language: Language): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('lang', language);
    }
  }
}
