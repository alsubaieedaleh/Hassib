import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductManagerComponent } from './product-manager.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { SupabaseServiceStub } from '../../../testing/supabase-service.stub';
import { InventoryService } from '../../shared/services/inventory-service';
import { InventoryServiceStub } from '../../../testing/inventory-service.stub';

describe('ProductManagerComponent', () => {
  let component: ProductManagerComponent;
  let fixture: ComponentFixture<ProductManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductManagerComponent],
      providers: [
        { provide: SupabaseService, useClass: SupabaseServiceStub },
        { provide: InventoryService, useClass: InventoryServiceStub },
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProductManagerComponent);
    component = fixture.componentInstance;
    // The template references a products() helper used for local caching; stub it for tests.
    (component as unknown as { products: () => unknown[] }).products = () => [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
