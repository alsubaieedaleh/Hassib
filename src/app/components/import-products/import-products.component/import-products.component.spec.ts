import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportProductsComponent } from './import-products.component';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { SupabaseServiceStub } from '../../../../testing/supabase-service.stub';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../../shared/services/inventory-service';
import { InventoryServiceStub } from '../../../../testing/inventory-service.stub';
import { StorageLocationService } from '../../../shared/services/storage-location.service';
import { StorageLocationServiceStub } from '../../../../testing/storage-location-service.stub';

describe('ImportProductsComponent', () => {
  let component: ImportProductsComponent;
  let fixture: ComponentFixture<ImportProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportProductsComponent],
      providers: [
        { provide: SupabaseService, useClass: SupabaseServiceStub },
        { provide: InventoryService, useClass: InventoryServiceStub },
        { provide: StorageLocationService, useClass: StorageLocationServiceStub },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
