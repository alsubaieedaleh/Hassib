import { Component, ElementRef, HostBinding, Input } from '@angular/core';

export type UiInputSize = 'sm' | 'md' | 'lg';
type UiInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

@Component({
  selector: 'input[uiInput], textarea[uiInput], select[uiInput]',
  standalone: true,
  template: '',
  styleUrls: ['./ui-input.component.scss']
})

export class UiInputComponent {
  @Input() uiInputSize: UiInputSize = 'md';

  constructor(private readonly elementRef: ElementRef<UiInputElement>) {}

  @HostBinding('class.ui-input') baseClass = true;
  @HostBinding('class.ui-input--sm') get isSmall(): boolean {
    return this.uiInputSize === 'sm';
  }

  @HostBinding('class.ui-input--lg') get isLarge(): boolean {
    return this.uiInputSize === 'lg';
  }

  @HostBinding('class.ui-input--textarea') get isTextarea(): boolean {
    return this.elementRef.nativeElement.tagName === 'TEXTAREA';
  }

  @HostBinding('class.ui-input--select') get isSelect(): boolean {
    return this.elementRef.nativeElement.tagName === 'SELECT';
  }

  @HostBinding('class.ui-input--disabled') get isDisabled(): boolean {
    return this.elementRef.nativeElement.disabled;
  }
}
