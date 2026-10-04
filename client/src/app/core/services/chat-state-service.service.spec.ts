import { TestBed } from '@angular/core/testing';

import { ChatStateServiceService } from './chat-state-service.service';

describe('ChatStateServiceService', () => {
  let service: ChatStateServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatStateServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
