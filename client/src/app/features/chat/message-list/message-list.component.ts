import {
  Component,
  effect,
  inject,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';
import { MessageService } from '../../../core/services/message.service';
import { Message } from '../../../core/models/message.model';
import { CommonModule, DatePipe } from '@angular/common';
import { TokenService } from '../../../core/services/token.service';
import { MessageStateService } from '../../../core/services/message-state.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditMessageDialogComponent } from '../edit-message-dialog/edit-message-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    DatePipe,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss'
})
export class MessageListComponent implements OnDestroy, AfterViewChecked {
  readonly chatState = inject(ChatStateServiceService);
  readonly messageState = inject(MessageStateService);
  private readonly messageService = inject(MessageService);
  private readonly tokenService = inject(TokenService);
  private readonly dialog = inject(MatDialog);
  private readonly chatService = inject(ChatService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  messages: Message[] = [];
  loading = false;
  errorMessage = '';
  loadingOlder = false;
  hasMoreMessages = true;
  unreadCount = 0;
  isAtBottom = true;

  private prevLastMessageId: string | null = null;
  private prevMessageCount = 0;
  private shouldScroll = false;

  private readonly roomEffect = effect(() => {
    const room = this.chatState.selectedRoom();

    if (!room) {
      this.messageState.clearMessage();
      this.prevLastMessageId = null;
      this.prevMessageCount = 0;
      this.unreadCount = 0;
      return;
    }

    const roomId = room._id || room.roomId;
    if (roomId) {
      this.prevLastMessageId = null;
      this.prevMessageCount = 0;
      this.unreadCount = 0;
      this.hasMoreMessages = true;
      this.loadMessages(roomId);
    } else {
      this.messages = [];
    }
  });

  // Track new message arrivals to scroll down or show badge
  private readonly newMessagesEffect = effect(() => {
    const currentMessages = this.messageState.message();
    if (!currentMessages || currentMessages.length === 0) {
      this.prevLastMessageId = null;
      this.prevMessageCount = 0;
      return;
    }

    const lastMsg = currentMessages[currentMessages.length - 1];
    const isAppended =
      currentMessages.length > this.prevMessageCount &&
      this.prevLastMessageId !== lastMsg._id;

    if (isAppended && this.prevMessageCount > 0) {
      if (this.isOwnMessage(lastMsg) || this.isNearBottom()) {
        setTimeout(() => this.scrollToBottom(), 50);
        this.unreadCount = 0;
      } else {
        this.unreadCount++;
      }
    }

    this.prevLastMessageId = lastMsg._id;
    this.prevMessageCount = currentMessages.length;
  });

  ngOnInit() {
    this.chatService.onNewMessage().subscribe((message) => {
      const currentRoom = this.chatState.selectedRoom();
      const currentRoomId = currentRoom?._id || currentRoom?.roomId;
      const msgRoomId = typeof message.roomId === 'object' ? (message.roomId as any)?._id : message.roomId;

      if (currentRoomId == msgRoomId) {
        const alreadyExists = this.messageState.message().some((m) => m._id === message._id);
        if (alreadyExists) {
          return;
        }
        this.messageState.addMessage(message);
      }
    });
    this.chatService.onMessageUpdated().subscribe((updated) => {
      this.messageState.updateMessage(updated);
    });
    this.chatService.onMessageDeleted().subscribe(({ messageId }) => {
      this.messageState.removeMessage(messageId);
    })
  }

  loadMessages(roomId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.messageService.getMessages(roomId).subscribe({
      next: (messages) => {
        const currentRoom = this.chatState.selectedRoom();
        const currentRoomId = currentRoom?._id || currentRoom?.roomId;
        if (currentRoomId !== roomId) {
          return;
        }
        const chronological = [...messages].reverse();
        if (messages.length < 50) {
          this.hasMoreMessages = false;
        }
        this.messageState.setMessages(chronological);
        this.messages = chronological;
        this.loading = false;
        this.shouldScroll = true;
      },
      error: (error) => {
        const currentRoom = this.chatState.selectedRoom();
        const currentRoomId = currentRoom?._id || currentRoom?.roomId;
        if (currentRoomId !== roomId) {
          return;
        }
        console.error('Failed to load Messages', error);
        this.errorMessage =
          error?.error?.response?.message ||
          error?.error?.message ||
          'Failed to load messages';
        this.loading = false;
      }
    });
  }

  getSenderName(message: Message): string {
    if (message.senderId && typeof message.senderId === 'object') {
      return message.senderId.name || 'Anonymous';
    }
    return 'User';
  }

  getSenderInitial(message: Message): string {
    const name = this.getSenderName(message);
    return name.charAt(0).toUpperCase() || 'U';
  }

  isOwnMessage(message: Message): boolean {
    const currentUser = this.tokenService.getUser();
    if (!currentUser) return false;
    const currentId = currentUser._id || currentUser.id;
    const senderId =
      typeof message.senderId === 'object'
        ? message.senderId?._id
        : message.senderId;
    return Boolean(currentId && senderId && currentId === senderId);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  editMessage(message: Message) {
    const room = this.chatState.selectedRoom();

    if (!room) {
      return;
    }

    const roomId = room._id || room.roomId;
    if (!roomId) {
      return;
    }

    const dialogRef = this.dialog.open(EditMessageDialogComponent, {
      width: '500px',
      data: {
        content: message.content
      }
    });

    dialogRef.afterClosed().subscribe((content?: string) => {
      if (!content || content === message.content) {
        return;
      }
      this.chatService.updateMessage(roomId, message._id, content).then((response) => {
        this.messageState.updateMessage(response.message)
      })
        .catch((error) => {
          console.log('Failed to update message via socket', error);
          alert(error?.message || 'Failed to update message');
        })

      // using rest api
      // this.messageService.updateMessage(roomId, message._id, content).subscribe({
      //   next: (updatedMessage) => {
      //     this.messageState.updateMessage(updatedMessage);
      //   },
      //   error: (error) => {
      //     console.error('Failed to update message', error);
      //   }
      // });
    });
  }

  deleteMessage(message: Message): void {
    const room = this.chatState.selectedRoom();

    if (!room) {
      return;
    }

    const roomId = room._id || room.roomId;
    if (!roomId) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this message?'
    );

    if (!confirmed) {
      return;
    }

    // this.messageService.deleteMessage(roomId, message._id).subscribe({
    //   next: () => {
    //     this.messageState.removeMessage(message._id);
    //   },
    //   error: (error) => {
    //     console.error('Failed to delete message', error);
    //   }
    // });

    this.chatService.deleteMessage(roomId, message._id).then(() => {
      this.messageState.removeMessage(message._id);
    }).catch((error) => {
      console.error('Failed to delete message via socket', error);
      alert(error?.message || "Failed to delete message")
    })

  }

  loadMoreMessages(): void {
    if (this.loadingOlder || !this.hasMoreMessages || this.loading) {
      return;
    }

    const container = this.scrollContainer?.nativeElement;
    if (!container) {
      return;
    }

    const room = this.chatState.selectedRoom();
    if (!room) {
      return;
    }

    const messages = this.messageState.message();
    if (!messages.length) {
      return;
    }

    const oldestMessage = messages[0];
    this.loadingOlder = true;

    // 1. Capture height & scroll position before prepending
    const previousScrollHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;

    const roomId = room._id || room.roomId;
    this.messageService.getMessages(roomId, 50, oldestMessage.createdAt).subscribe({
      next: (olderMessages) => {
        if (!olderMessages || olderMessages.length === 0) {
          this.hasMoreMessages = false;
          this.loadingOlder = false;
          return;
        }

        if (olderMessages.length < 50) {
          this.hasMoreMessages = false;
        }

        // 2. Prepend older messages to state
        this.messageState.prependMessages([...olderMessages].reverse());
        this.loadingOlder = false;

        // 3. Compensate scroll position so viewport stays anchored
        requestAnimationFrame(() => {
          const heightDifference = container.scrollHeight - previousScrollHeight;
          container.scrollTop = previousScrollTop + heightDifference;
        });
      },
      error: (error) => {
        console.error('Failed to load older messages', error);
        this.loadingOlder = false;
      }
    });
  }

  isNearBottom(threshold = 120): boolean {
    if (!this.scrollContainer) return true;
    const el = this.scrollContainer.nativeElement;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
      this.isAtBottom = true;
    }
  }

  scrollToBottomSmooth(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
      this.unreadCount = 0;
      this.isAtBottom = true;
    }
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;

    this.isAtBottom = this.isNearBottom();
    if (this.isAtBottom) {
      this.unreadCount = 0;
    }

    // When user scrolls near top, fetch older messages
    if (element.scrollTop <= 60 && this.hasMoreMessages && !this.loadingOlder && !this.loading) {
      this.loadMoreMessages();
    }
  }

  ngOnDestroy(): void {
    this.roomEffect.destroy();
    this.newMessagesEffect.destroy();
  }
}
