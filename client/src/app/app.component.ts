import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenService } from './core/services/token.service';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'client';
  private readonly tokenService = inject(TokenService);
  private readonly socketService = inject(SocketService);

  ngOnInit() {
    if (this.tokenService.getAccessToken()) { this.socketService.connect(); }
  }
}
