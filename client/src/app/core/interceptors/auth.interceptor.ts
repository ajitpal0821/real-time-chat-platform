import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment.development';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService)
  const token = tokenService.getAccessToken();
  const http = inject(HttpClient);
  const router = inject(Router);

  if (!token) {
    return next(req);
  }
  const authRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
  return next(authRequest).pipe(catchError((error: HttpErrorResponse) => {
    const isTokenExpired = error.status == 401 && error.error?.error?.code === "TOKEN_EXPIRED";
    const isRefreshUrl = req.url.includes('/auth/refresh');

    if (isTokenExpired && !isRefreshUrl) {
      const refreshToken = tokenService.getRefreshToken();

      if (refreshToken) {
        return http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
          switchMap((res) => {
            const newAccessToken = res.response?.data?.accessToken || res.data?.accessToken;

            tokenService.setAccessToken(newAccessToken);
            const retryRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newAccessToken}`
              }
            })
            return next(retryRequest)
          }),
          catchError((refreshError) => {
            tokenService.clearTokens();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError)
          })
        )
      }

    }

    if (error.status == 401 && (error.error?.error?.code === "INVALID_TOKEN" || error.error?.error?.code === "UNAUTHORIZED")) {
      tokenService.clearTokens();
      router.navigate(['/auth/login']);
      return throwError(() => error)
    }
    return throwError(() => error)
  }));
};
