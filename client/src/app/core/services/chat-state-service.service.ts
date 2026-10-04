import { Injectable, signal } from '@angular/core';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class ChatStateServiceService {
  constructor() { }

  private readonly roomsState = signal<Room[]>([]);
  private readonly selectedRoomState = signal<Room | null>(null);

  readonly rooms = this.roomsState.asReadonly();
  readonly selectedRoom = this.selectedRoomState.asReadonly();


  private readonly typingUsersState = signal<string[]>([]);
  readonly typingUsers = this.typingUsersState.asReadonly();



  private readonly onlineUserState = signal<Set<string>>(new Set());
  readonly onlineUsers = this.onlineUserState.asReadonly();
  setRooms(rooms: Room[]): void {
    this.roomsState.set(rooms);
  }

  addRoom(room: Room): void {
    this.roomsState.update((current) => {
      const exists = current.some(
        (r) =>
          (Boolean(room._id) && r._id === room._id) ||
          (Boolean(room.roomId) && Boolean(r.roomId) && r.roomId === room.roomId)
      );
      return exists ? current : [...current, room];
    });
  }

  removeRoom(roomId: string): void {
    const remaining = this.roomsState().filter(
      (r) => r._id !== roomId && r.roomId !== roomId
    );
    this.roomsState.set(remaining);

    const currentSelected = this.selectedRoomState();
    if (
      currentSelected &&
      (currentSelected._id === roomId || currentSelected.roomId === roomId)
    ) {
      if (remaining.length > 0) {
        this.selectedRoomState.set(remaining[0]);
      } else {
        this.selectedRoomState.set(null);
      }
    }
  }

  selectRoom(room: Room | null): void {
    this.selectedRoomState.set(room);
    this.typingUsersState.set([])
  }

  clearSelectionRoom(): void {
    this.selectedRoomState.set(null);
  }
  addTypingUser(userId: string): void {
    this.typingUsersState.update(c => c.includes(userId) ? c : [...c, userId]);
  }
  removeTypingUser(userId: string): void {
    this.typingUsersState.update(c => c.filter(id => id !== userId));
  }
  clearTypingUsers(): void {
    this.typingUsersState.set([]);
  }


  setOnlineUsers(userIds: string[]): void {
    this.onlineUserState.set(new Set(userIds));
  }
  setUserOnline(userId: string): void {
    this.onlineUserState.update(current => {
      const updated = new Set(current);
      updated.add(userId);
      return updated;
    })

  }
  setUserOffline(userId: string): void {
    this.onlineUserState.update(current => {
      const updated = new Set(current);
      updated.delete(userId);
      return updated;
    })
  }
  isUserOnline(userId: string): boolean {
    return this.onlineUserState().has(userId);
  }
}
