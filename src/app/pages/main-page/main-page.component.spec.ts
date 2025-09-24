import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MainPageComponent } from './main-page.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { SupabaseServiceStub } from '../../../testing/supabase-service.stub';
import { InventoryService } from '../../shared/services/inventory-service';
import { InventoryServiceStub } from '../../../testing/inventory-service.stub';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent, RouterTestingModule],
      providers: [
        { provide: SupabaseService, useClass: SupabaseServiceStub },
        { provide: InventoryService, useClass: InventoryServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
