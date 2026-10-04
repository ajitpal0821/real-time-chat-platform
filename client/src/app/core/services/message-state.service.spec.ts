import { TestBed } from '@angular/core/testing';

import { MessageStateService } from './message-state.service';

describe('MessageStateService', () => {
  let service: MessageStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
