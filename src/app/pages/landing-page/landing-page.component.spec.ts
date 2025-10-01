import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent | undefined;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
    component = undefined;
  });

  it('calculates VAT summary for default values', () => {
    const summary = component!.vatSummary();
    expect(summary.netAmount).toBe(25000);
    expect(summary.vatDue).toBeCloseTo(3750, 2);
    expect(summary.grossAmount).toBeCloseTo(28750, 2);
    expect(component!.provisionWidth()).toBeGreaterThan(0);
  });

  it('updates VAT rate when jurisdiction changes', () => {
    component!.onJurisdictionChange('ae');
    expect(component!.vatCalculatorForm.value.vatRate).toBe(5);

    component!.onJurisdictionChange('bh');
    expect(component!.vatCalculatorForm.value.vatRate).toBe(10);
  });

  it('validates VAT numbers via heuristic checker', () => {
    component!.vatCheckerForm.setValue({ vatNumber: 'XF5XBKXCGCN9', country: 'sa' });
    component!.onVatCheck();
    expect(component!.vatCheckerStatus().state).toBe('valid');

    component!.vatCheckerForm.setValue({ vatNumber: '123', country: 'sa' });
    component!.onVatCheck();
    expect(component!.vatCheckerStatus().state).toBe('invalid');
  });

  it('registers SEO meta tags', () => {
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")).toBeTruthy();
    expect(meta.getTag("property='og:title'")).toBeTruthy();
  });

  it('exposes canonical link and structured data for crawlers', () => {
    const documentRef = TestBed.inject(DOCUMENT);
    const canonical = documentRef.querySelector("link[rel='canonical']");
    expect(canonical?.getAttribute('href')).toBe('https://app.hassib.dev/landing');

    const structuredData = JSON.parse(component!.structuredDataJson) as Array<Record<string, any>>;
    const faqSchema = structuredData.find(entry => entry['@type'] === 'FAQPage');
    expect(faqSchema).toBeTruthy();
    expect(Array.isArray(faqSchema!['mainEntity'])).toBe(true);
    expect((faqSchema!['mainEntity'] as Array<unknown>).length).toBeGreaterThan(0);
  });
});
