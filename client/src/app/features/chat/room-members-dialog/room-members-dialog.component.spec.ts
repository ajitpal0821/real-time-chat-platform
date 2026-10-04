import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomMembersDialogComponent } from './room-members-dialog.component';

describe('RoomMembersDialogComponent', () => {
  let component: RoomMembersDialogComponent;
  let fixture: ComponentFixture<RoomMembersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomMembersDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomMembersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
