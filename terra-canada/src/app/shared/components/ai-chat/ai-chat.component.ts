import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, ChatMessage } from './ai-chat.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  providers: [AiChatService],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isSending = false;

  constructor(private aiChatService: AiChatService) {}

  ngOnInit(): void {
    this.aiChatService.messages$.subscribe((messages) => {
      this.messages = messages;
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.isSending = true;
      this.aiChatService.addMessage(this.newMessage, 'user');
      this.newMessage = '';
      
      setTimeout(() => {
        this.isSending = false;
      }, 500);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
