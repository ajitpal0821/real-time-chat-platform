import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RoomService } from '../../../core/services/room.service';
import { RoomMember } from '../../../core/models/room-member.model';
import { ChatStateServiceService } from '../../../core/services/chat-state-service.service';

@Component({
  selector: 'app-room-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './room-members-dialog.component.html',
  styleUrl: './room-members-dialog.component.scss'
})
export class RoomMembersDialogComponent {
  private readonly roomService = inject(RoomService);
  readonly chatState = inject(ChatStateServiceService);
  readonly roomId = inject<string>(MAT_DIALOG_DATA);

  members = signal<RoomMember[]>([]);
  searchQuery = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  filteredMembers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const allMembers = this.members();

    if (!query) {
      return allMembers;
    }

    return allMembers.filter((member) => {
      const name = this.getMemberName(member).toLowerCase();
      const email = this.getMemberEmail(member).toLowerCase();
      const role = (member.role || '').toLowerCase();
      return name.includes(query) || email.includes(query) || role.includes(query);
    });
  });

  ownerCount = computed(() => this.members().filter((m) => m.role === 'owner').length);
  adminCount = computed(() => this.members().filter((m) => m.role === 'admin').length);

  constructor() {
    this.loadRoomMembers();
  }

  loadRoomMembers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.roomService.getMembers(this.roomId).subscribe({
      next: (members) => {
        this.members.set(members || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.response?.message ||
          err?.error?.message ||
          'Failed to load members'
        );
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value || '';
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  getMemberName(member: RoomMember): string {
    if (member.userId && typeof member.userId === 'object') {
      return member.userId.name || 'Anonymous User';
    }
    return 'User (' + String(member.userId || member._id).substring(0, 6) + ')';
  }

  getMemberEmail(member: RoomMember): string {
    if (member.userId && typeof member.userId === 'object') {
      return member.userId.email || '';
    }
    return '';
  }

  getMemberInitial(member: RoomMember): string {
    const name = this.getMemberName(member);
    return name.charAt(0).toUpperCase() || 'U';
  }

  getAvatarGradient(member: RoomMember): string {
    if (member.role === 'owner') {
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }
    if (member.role === 'admin') {
      return 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)';
    }
    // Deterministic pleasant color for regular members based on their initial
    const colors = [
      'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'linear-gradient(135deg, #64748b 0%, #475569 100%)'
    ];
    const charCode = this.getMemberInitial(member).charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  }
  getMemberId(member: RoomMember): string {
    if (member.userId && typeof member.userId === 'object') {
      return member.userId._id;
    }
    return String(member.userId || member._id)
  }
}
