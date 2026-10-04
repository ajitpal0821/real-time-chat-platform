import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMessageDialogComponent } from './edit-message-dialog.component';

describe('EditMessageDialogComponent', () => {
  let component: EditMessageDialogComponent;
  let fixture: ComponentFixture<EditMessageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMessageDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMessageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
