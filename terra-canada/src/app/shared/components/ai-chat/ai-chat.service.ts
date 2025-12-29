import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente virtual de Terra Canada. Estoy aquí para ayudarte.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  addMessage(text: string, sender: 'user' | 'bot'): void {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);

    // Simular respuesta del bot después de 1 segundo
    if (sender === 'user') {
      setTimeout(() => {
        this.addBotResponse();
      }, 1000);
    }
  }

  private addBotResponse(): void {
    const responses = [
      '¿En qué más puedo ayudarte?',
      'Entendido. ¿Hay algo más que necesites?',
      'Perfecto. ¿Tienes otra pregunta?',
      'Claro, estoy aquí para asistirte.'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: randomResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);
  }

  clearMessages(): void {
    this.messagesSubject.next([
      {
        id: '1',
        text: '¡Hola! Soy tu asistente virtual de Terra Canada. Estoy aquí para ayudarte.',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }
}
