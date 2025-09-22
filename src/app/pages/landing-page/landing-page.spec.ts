import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { LandingPage } from './landing-page.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { SupabaseServiceStub } from '../../../testing/supabase-service.stub';
import { InventoryService } from '../../shared/services/inventory-service';
import { InventoryServiceStub } from '../../../testing/inventory-service.stub';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage, RouterTestingModule],
      providers: [
        { provide: SupabaseService, useClass: SupabaseServiceStub },
        { provide: InventoryService, useClass: InventoryServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
