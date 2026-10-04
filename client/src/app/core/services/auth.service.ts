import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environment/environment.development';
import { SocketService } from './socket.service';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private socketService: SocketService, private tokenService: TokenService, private router: Router) { }
  private apiUrl = environment.apiUrl

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, data)
      .pipe(map(({ response }) => response.data));
  }


  register(data: RegisterRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(
      `${this.apiUrl}/auth/register`,
      data
    ).pipe(map(({ response }) => response.data));
  }
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/users/me`
    );
  }
  logout() {
    this.tokenService.clearTokens();
    this.socketService.disconnect();
    this.router.navigate(['/auth/login'])
  }
}
