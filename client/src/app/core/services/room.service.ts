import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Room } from '../models/room.model';
import { ApiResponse } from '../models/auth.model';
import { environment } from '../../../environment/environment.development';
import { RoomMember } from '../models/room-member.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() { }

  getRooms(): Observable<Room[]> {
    return this.http
      .get<ApiResponse<Room[]>>(`${this.apiUrl}/rooms`)
      .pipe(map(({ response }) => response.data));
  }

  getRoom(roomId: string): Observable<Room> {
    return this.http
      .get<ApiResponse<Room>>(`${this.apiUrl}/rooms/${roomId}`)
      .pipe(map(({ response }) => response.data));
  }

  createRoom(data: { name: string; isPrivate?: boolean }): Observable<Room> {
    return this.http
      .post<ApiResponse<Room>>(`${this.apiUrl}/rooms`, data)
      .pipe(map(({ response }) => response.data));
  }

  joinRoom(roomId: string): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/rooms/${roomId}/join`, {})
      .pipe(map(({ response }) => response.data));
  }

  leaveRoom(roomId: string): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/rooms/${roomId}/leave`, {})
      .pipe(map(({ response }) => response.data));
  }

  getMembers(roomId: string): Observable<RoomMember[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/rooms/${roomId}/members`)
      .pipe(map(({ response }) => response.data));
  }
}
