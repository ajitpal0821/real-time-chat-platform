import { inject, Injectable } from '@angular/core';
import { TokenService } from './token.service';
import io, { Socket } from 'socket.io-client';
import { environment } from '../../../environment/environment.development';
import { Observable, Subscriber } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private readonly tokenService = inject(TokenService);
  private socket: Socket | null = null;
  constructor() { }

  connect() {

    if (this.socket?.connected) {
      return;
    }
    const token = this.tokenService.getAccessToken();
    if (!token) {
      console.error('Connot connect Socket.io access token missing');
      return;
    }

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'], auth: { token }
    });
    this.registerConnectionEvents();
  }
  private registerConnectionEvents() {
    if (!this.socket) {
      return;
    }

    this.socket.on('connect', () => {
      console.log('Socket Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connect error: ', error.message);
    });
  }

  disconnect() {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket = null;
    console.log('Disconnected from Socket.IO Server');
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (!this.socket) {
        return;
      }

      const handler = (data: T) => {
        subscriber.next(data);
      };

      this.socket.on(eventName, handler);

      return () => {
        this.socket?.off(eventName, handler)
      }
    })
  }

  emitWithAck<T>(event: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        return reject(new Error('Socket is not connected'));
      }
      this.socket.emit(event, payload, (response: any) => {
        if (response?.success == false || response?.status == 'error') {
          reject(new Error(response?.message || 'Socket emit failed'));
        } else {
          resolve(response)
        }
      })
    })
  }

  emit(eventName: string, payload: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, payload)
    } else {
      console.error('')
    }

  }
}
