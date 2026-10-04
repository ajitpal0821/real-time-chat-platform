import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.development';
import { ApiResponse } from '../models/auth.model';
import { Message, SendMessageRequest } from '../models/message.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor() { }

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMessages(roomId: string, limit: number = 50, before?: string): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit);

    if (before) {
      params = params.set('before', before);
    }

    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/rooms/${roomId}/messages`, { params }).pipe(
      map(({ response }) => response.data)
    );
  }
  sendMessage(roomId: string, data: SendMessageRequest): Observable<Message> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/rooms/${roomId}/messages`, data).pipe(
      map(({ response }) => response.data)
    )
  }

  updateMessage(
    roomId: string,
    messageId: string,
    content: string
  ): Observable<Message> {

    return this.http
      .patch<ApiResponse<Message>>(
        `${this.apiUrl}/rooms/${roomId}/messages/${messageId}`,
        { content }
      )
      .pipe(
        map(({ response }) => response.data)
      );
  }

  deleteMessage(
    roomId: string,
    messageId: string
  ): Observable<void> {

    return this.http
      .delete<ApiResponse<null>>(
        `${this.apiUrl}/rooms/${roomId}/messages/${messageId}`
      )
      .pipe(
        map(() => undefined)
      );
  }
}
