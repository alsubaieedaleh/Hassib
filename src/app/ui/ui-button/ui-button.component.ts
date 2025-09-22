import { Component, HostBinding, Input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[uiButton], a[uiButton]',
  standalone: true,
  template: '<ng-content />',
  styleUrls: ['./ui-button.component.scss']
})
export class UiButtonComponent {
  private _variant: UiButtonVariant = 'primary';

  @Input()
  set uiButton(value: UiButtonVariant | '') {
    this._variant = value === '' ? 'primary' : value;
  }

  get uiButton(): UiButtonVariant {
    return this._variant;
  }

  @Input() uiButtonSize: UiButtonSize = 'md';
  @Input() uiButtonTone: 'default' | 'success' = 'default';
  @Input() uiButtonInteractive = true;

  @HostBinding('class.ui-button') baseClass = true;
  @HostBinding('class.ui-button--primary') get isPrimary(): boolean {
    return this.uiButton === 'primary';
  }

  @HostBinding('class.ui-button--secondary') get isSecondary(): boolean {
    return this.uiButton === 'secondary';
  }

  @HostBinding('class.ui-button--ghost') get isGhost(): boolean {
    return this.uiButton === 'ghost';
  }

  @HostBinding('class.ui-button--outline') get isOutline(): boolean {
    return this.uiButton === 'outline';
  }

  @HostBinding('class.ui-button--danger') get isDanger(): boolean {
    return this.uiButton === 'danger';
  }

  @HostBinding('class.ui-button--sm') get isSmall(): boolean {
    return this.uiButtonSize === 'sm';
  }

  @HostBinding('class.ui-button--lg') get isLarge(): boolean {
    return this.uiButtonSize === 'lg';
  }

  @HostBinding('class.ui-button--success') get isSuccessTone(): boolean {
    return this.uiButtonTone === 'success';
  }

  @HostBinding('class.ui-button--static') get isStatic(): boolean {
    return !this.uiButtonInteractive;
  }
}
