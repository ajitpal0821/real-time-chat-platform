import { Component, inject, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageService } from '../../../core/services/message.service';
import { MessageStateService } from '../../../core/services/message-state.service';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly messageState = inject(MessageStateService);
  readonly chatState = inject(ChatStateServiceService);
  private readonly chatService = inject(ChatService);


  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;

  readonly messageForm = this.fb.nonNullable.group({
    content: [
      '',
      [
        Validators.required,
        Validators.maxLength(5000)
      ]
    ]
  });

  sending = false;
  errorMessage = '';

  placeholderText = computed(() => {
    const room = this.chatState.selectedRoom();
    return room ? `Message #${room.name}...` : 'Type a message...';
  });

  get hasContent(): boolean {
    return Boolean(this.messageForm.controls.content.value.trim());
  }

  onTyping(): void {
    const room = this.chatState.selectedRoom();
    const roomId = room?._id || room?.roomId;
    if (!roomId) return;
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatService.startTyping(roomId);   // emit once, not per keystroke
    }
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.stopTyping(roomId), 2000);
  }

  private stopTyping(roomId: string): void {
    if (this.typingTimeout) { clearTimeout(this.typingTimeout); this.typingTimeout = null; }
    if (this.isTyping) {
      this.isTyping = false;
      this.chatService.stopTyping(roomId);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (this.messageForm.invalid || this.sending) {
      return;
    }

    const room = this.chatState.selectedRoom();
    if (!room) {
      return;
    }

    const roomId = room._id || room.roomId;
    if (!roomId) {
      return;
    }

    const content = this.messageForm.controls.content.value.trim();
    if (!content) {
      return;
    }
    this.stopTyping(roomId);
    this.sending = true;
    this.errorMessage = '';

    // this.messageService
    //   .sendMessage(roomId, {
    //     content,
    //     messageType: 'text'
    //   })
    //   .subscribe({
    //     next: (message) => {
    //       this.messageState.addMessage(message);
    //       this.messageForm.reset();
    //       this.sending = false;
    //     },
    //     error: (error) => {
    //       console.error('Failed to send message', error);
    //       this.errorMessage =
    //         error?.error?.response?.message ||
    //         error?.error?.message ||
    //         'Failed to send message';
    //       this.sending = false;
    //     }
    //   });

    this.chatService.sendMessage(roomId, content)
      .then((response) => {
        const alreadyExists = this.messageState.message().some((m) => m._id === response.message._id);
        if (!alreadyExists) {
          this.messageState.addMessage(response.message);
        }
        this.messageForm.reset();
        this.sending = false;
      })
      .catch((error) => {
        console.error('Failed to send message via socket', error);
        this.errorMessage = error?.message || 'Failed to send message';
        this.sending = false;
      });
  }
}
