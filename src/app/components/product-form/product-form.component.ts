import { Component, Signal, WritableSignal, computed, effect, inject, input, output, signal } from '@angular/core';
import { ProductFormValue } from '../../shared/models/product.model';
import { Payment } from '../../shared/models/line.model';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../shared/services/inventory-service';
import { StorageLocationService } from '../../shared/services/storage-location.service';
import { StorageLocation } from '../../shared/models/storage-location.model';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../ui';


interface ProductSignals {
  barcode: WritableSignal<string>;
  name: WritableSignal<string>;
  qty: WritableSignal<number>;
  price: WritableSignal<number>;
  cost: WritableSignal<number>;
}

@Component({
  selector: 'product-form',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent, UiInputComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent {
  private inventory = inject(InventoryService);
  private readonly locationService = inject(StorageLocationService);

  showPayment = input<boolean>(true);
  showPhone = input<boolean>(true);
  showVAT = input<boolean>(true);
  fixedVATRate = input<number>(15);
  submitLabel = input<string>('Sell');
  showLocation = input<boolean>(false);

  // OUTPUT SIGNAL
  submitted = output<Signal<{
    products: ProductFormValue[];
    payment: Payment;
    phone: string;
    locationId: number | null;
    locationName: string | null;
  }>>();

  // FORM STATE
  productForms = signal<ProductSignals[]>([this.createProductForm()]);
  payment = signal<Payment>('Cash');
  phone = signal<string>('');
  locationId = signal<number | null>(null);

  paymentOptions: Payment[] = ['Cash', 'Mada', 'Credit Card', 'On Account'];
  readonly locationsSignal = this.locationService.locations();
  readonly locationLoading = this.locationService.loading();
  readonly locationError = this.locationService.error();

  locationOptions = computed<StorageLocation[]>(() => this.locationsSignal());

  constructor() {
    effect(() => {
      if (!this.showLocation()) {
        return;
      }

      const options = this.locationOptions();

      if (!options.length) {
        void this.locationService.ensureSeedLocation();
        return;
      }

      if (this.locationId() == null) {
        this.locationId.set(options[0]?.id ?? null);
      }
    });
  }


productFields = [
  {
    key: 'barcode',
    label: 'Barcode',
    type: 'text',
    placeholder: 'example: 43423344',
    icon: [
      { d: 'M4 4h2v16H4z' },
      { d: 'M10 4h2v16h-2z' },
      { d: 'M16 4h2v16h-2z' },
    ],
    getter: (f: ProductSignals) => f.barcode(),
  onInput: (f: ProductSignals, e: Event) => this.onBarcodeInput(f, e),
  },
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    placeholder: 'example: water bottle',
    icon: [
      { d: 'M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7' },
      { d: 'M17 8 12 3 7 8' },
      { d: 'M12 3v12' },
    ],
    getter: (f: ProductSignals) => f.name(),
    onInput: (f: ProductSignals, e: Event) => this.onStringInput(f.name, e),
  },
  {
    key: 'qty',
    label: 'Quantity',
    type: 'number',
    placeholder: '1',
    min: 1,
    icon: [
      { d: 'M12 5v14' },
      { d: 'M5 12h14' },
    ],
    getter: (f: ProductSignals) => f.qty(),
    onInput: (f: ProductSignals, e: Event) => f.qty.set(this.parseInputNumber(e)),
  },
  {
    key: 'price',
    label: 'Sell Price (SAR)',
    type: 'number',
    placeholder: '0.00',
    min: 0,
    step: '0.01',
    icon: [
      { d: 'M12 1v22' },
      { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    ],
    getter: (f: ProductSignals) => f.price(),
    onInput: (f: ProductSignals, e: Event) => f.price.set(this.parseInputNumber(e)),
  },
  {
    key: 'cost',
    label: 'Cost Price (SAR)',
    type: 'number',
    placeholder: '0.00',
    min: 0,
    step: '0.01',
    icon: [
      { d: 'M2 5h20v14H2z' },
      { d: 'M2 10h20' },
    ],
    getter: (f: ProductSignals) => f.cost(),
    onInput: (f: ProductSignals, e: Event) => f.cost.set(this.parseInputNumber(e)),
  },
];


  private createProductForm(): ProductSignals {
    return {
      barcode: signal(''),
      name: signal(''),
      qty: signal(1),
      price: signal(0),
      cost: signal(0),
    };
  }

  addProduct() {
    this.productForms.set([...this.productForms(), this.createProductForm()]);
  }

  clear() {
    this.productForms.set([this.createProductForm()]);
    this.phone.set('');
    this.payment.set('Cash');
    const options = this.locationOptions();
    this.locationId.set(options.length ? options[0].id : null);
  }
  onBarcodeInput(f: ProductSignals, event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    f.barcode.set(value);

    const storedProduct = this.inventory.getByBarcode(value);
    if (storedProduct) {
      f.name.set(storedProduct.name);
      f.price.set(storedProduct.price);
      f.cost.set(storedProduct.cost);
      if (this.showLocation()) {
        this.locationId.set(storedProduct.locationId ?? this.locationId());
      }
    }
  }

  submit() {
    const products: ProductFormValue[] = this.productForms()
      .filter(p => p.name().trim())
      .map(p => ({
        barcode: p.barcode().trim(),
        name: p.name().trim(),
        qty: Math.max(1, p.qty()),
        price: Math.max(0, p.price()),
        cost: Math.max(0, p.cost()),
      }));

    if (products.length > 0) {
      const selectedLocation = this.locationOptions().find(loc => loc.id === this.locationId());
      this.submitted.emit(signal({
        products,
        payment: this.payment(),
        phone: this.phone(),
        locationId: this.locationId(),
        locationName: selectedLocation?.name ?? null,
      }));
      this.clear();
    } else {
      alert('No products to add.');
    }
  }

  // Reusable handlers
  parseInputNumber(event: Event): number {
    const value = (event.target as HTMLInputElement).value;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  onStringInput(sig: WritableSignal<string>, event: Event): void {
    sig.set((event.target as HTMLInputElement).value);
  }

  onPhoneInput(ev: Event) {
    this.phone.set((ev.target as HTMLInputElement).value);
  }

  onPaymentChange(ev: Event) {
    this.payment.set((ev.target as HTMLSelectElement).value as Payment);
  }
  onLocationChange(ev: Event) {
    const raw = (ev.target as HTMLSelectElement).value;
    if (raw === '') {
      this.locationId.set(null);
      return;
    }

    const value = Number(raw);
    this.locationId.set(Number.isFinite(value) ? value : null);
  }

  async createLocation(): Promise<void> {
    if (!this.showLocation()) {
      return;
    }

    const name = window.prompt('Storage location name');
    if (!name) {
      return;
    }

    try {
      const location = await this.locationService.createLocation({ name });
      this.locationId.set(location.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create storage location.';
      alert(message);
    }
  }
  removeProduct(index: number) {
    const forms = this.productForms();
    const updated = forms.slice(0, index).concat(forms.slice(index + 1));
    this.productForms.set(updated);
  }

}
