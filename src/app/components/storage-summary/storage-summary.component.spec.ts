import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageSummaryComponent } from './storage-summary.component';

describe('StorageSummaryComponent', () => {
  let component: StorageSummaryComponent;
  let fixture: ComponentFixture<StorageSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
