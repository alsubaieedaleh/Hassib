import { Component, HostBinding, Input } from '@angular/core';

export type UiCardVariant = 'elevated' | 'muted' | 'surface' | 'gradient';
export type UiCardPadding = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: '<ng-content />',
  styleUrls: ['./ui-card.component.scss']
})
export class UiCardComponent {
  @Input() uiCardVariant: UiCardVariant = 'elevated';
  @Input() uiCardPadding: UiCardPadding = 'md';
  @Input() uiCardInteractive = true;

  @HostBinding('class.ui-card') baseClass = true;
  @HostBinding('class.ui-card--elevated') get isElevated(): boolean {
    return this.uiCardVariant === 'elevated';
  }

  @HostBinding('class.ui-card--muted') get isMuted(): boolean {
    return this.uiCardVariant === 'muted';
  }

  @HostBinding('class.ui-card--surface') get isSurface(): boolean {
    return this.uiCardVariant === 'surface';
  }

  @HostBinding('class.ui-card--gradient') get isGradient(): boolean {
    return this.uiCardVariant === 'gradient';
  }

  @HostBinding('class.ui-card--sm') get isSmallPadding(): boolean {
    return this.uiCardPadding === 'sm';
  }

  @HostBinding('class.ui-card--lg') get isLargePadding(): boolean {
    return this.uiCardPadding === 'lg';
  }

  @HostBinding('class.ui-card--static') get isStatic(): boolean {
    return !this.uiCardInteractive;
  }
}
