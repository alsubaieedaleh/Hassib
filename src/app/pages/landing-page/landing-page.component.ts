import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './landing-page.component.html',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('320ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('tickerChange', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('260ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private title = inject(Title);
  private meta = inject(Meta);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);

  private subscriptions = new Subscription();
  private tickerTimer?: ReturnType<typeof setInterval>;

  readonly navSections = [
    { label: 'Tools', href: '#tools' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ];

  readonly heroHighlights = [
    'Realtime reconciliation for commodity, FX and local sales',
    'Consolidated VAT dashboards across markets and branches',
    'Self-serve analytics, PDF exports and Supabase ready APIs'
  ];

  readonly features = [
    {
      title: 'Unified trade workspace',
      description: 'Monitor spot, futures and in-store transactions with one risk score so treasury teams stay in control.'
    },
    {
      title: 'VAT and compliance guardrails',
      description: 'Automated VAT grouping, payer verification and scheduled reminders that keep traders audit ready.'
    },
    {
      title: 'Modular integrations',
      description: 'Connect Supabase, ERP feeds or Excel uploads without retooling your existing settlement stack.'
    },
    {
      title: 'Performance tuned delivery',
      description: 'Angular 17 SSR-first rendering, Tailwind UI primitives and built-in localisation for GCC teams.'
    }
  ];

  readonly reportingHighlights = [
    { label: 'Live margin', value: '18.4%', description: 'Change vs yesterday across FX and commodities.' },
    { label: 'Quarterly VAT due', value: 'SAR 142,380', description: 'Projected obligations for consolidated branches.' },
    { label: 'Cash flow runway', value: '9.2 months', description: 'Based on realised gains and expense pacing.' }
  ];

  readonly dashboardInsights = [
    {
      title: 'Scenario planning',
      description: 'Simulate rate changes, VAT adjustments and cross-border fees with trader-specific presets.'
    },
    {
      title: 'Automated exports',
      description: 'Schedule CSV, XLSX or Supabase function pushes aligned to your audit cadence.'
    },
    {
      title: 'Approval workflows',
      description: 'Route VAT overrides and discount approvals to finance leads with real-time audit trails.'
    }
  ];

  private tickerData = signal(
    [
      { pair: 'XAU/SAR', price: 7421.23, change: 0.8 },
      { pair: 'USD/SAR', price: 3.75, change: -0.02 },
      { pair: 'EUR/SAR', price: 4.06, change: 0.12 },
      { pair: 'BTC/SAR', price: 262350.0, change: 1.6 },
      { pair: 'Brent', price: 82.14, change: -0.45 }
    ].map(item => ({ ...item, previous: item.price }))
  );

  tickerIndex = signal(0);

  readonly vatCalculatorForm = this.fb.group({
    netAmount: [25000, [Validators.required, Validators.min(0)]],
    vatRate: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
    jurisdiction: ['sa', Validators.required]
  });

  readonly vatCheckerForm = this.fb.group({
    vatNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{8,15}$/i)]],
    country: ['sa', Validators.required]
  });

  readonly vatSummary = signal({
    vatDue: 0,
    grossAmount: 0,
    netAmount: 0,
    monthlyProvision: 0,
    quarterlyProvision: 0
  });

  readonly vatCheckerStatus = signal<{ state: 'idle' | 'valid' | 'invalid'; message: string }>({
    state: 'idle',
    message: ''
  });

  readonly currentYear = new Date().getFullYear();

  schemaMarkup: SafeHtml;

  constructor() {
    this.title.setTitle('Hassib POS | Cloud Retail Platform for Modern Stores');
    this.meta.addTags([
      { name: 'description', content: 'Hassib gives retail teams a fast POS, real-time inventory analytics and ready-to-connect Supabase authentication.' },
      {
        name: 'keywords',
        content: 'Hassib POS, GCC VAT tools, trader dashboard, Supabase Angular, retail trading platform, VAT calculator'
      },
      { property: 'og:title', content: 'Hassib POS – Retail operations in one place' },
      { property: 'og:description', content: 'Launch a modern POS with inventory management, VAT tools and Supabase-ready authentication.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://app.hassib.dev/landing' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Hassib POS | Modern Retail HQ' },
      { name: 'twitter:description', content: 'From sales to storage—Hassib centralises everything for ambitious retailers.' },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Hassib' }
    ], true);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Hassib POS VAT & Trading Platform',
      url: 'https://app.hassib.dev/landing',
      description:
        'Modern Angular VAT tooling, live trader dashboards and Supabase ready integrations for GCC retailers and trading desks.',
      inLanguage: 'en',
      publisher: {
        '@type': 'Organization',
        name: 'Hassib',
        url: 'https://app.hassib.dev'
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: 'https://app.hassib.dev/assets/og-image.png'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'Hassib VAT Suite',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: this.features.map(feature => feature.title)
      },
      potentialAction: {
        '@type': 'Action',
        name: 'Book onboarding call',
        target: 'https://app.hassib.dev/sign-up'
      }
    };

    this.schemaMarkup = this.sanitizer.bypassSecurityTrustHtml(JSON.stringify(schema));
  }

  ngOnInit(): void {
    this.updateVatSummary();
    this.subscriptions.add(
      this.vatCalculatorForm.valueChanges.subscribe(() => {
        this.updateVatSummary();
      })
    );

    this.subscriptions.add(
      this.vatCheckerForm.valueChanges.subscribe(() => {
        if (this.vatCheckerStatus().state !== 'idle') {
          this.vatCheckerStatus.set({ state: 'idle', message: '' });
        }
      })
    );

    this.tickerTimer = setInterval(() => {
      this.rotateTicker();
    }, 4500);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
    }
  }

  get tickerItems() {
    return this.tickerData();
  }

  get currentTicker() {
    const items = this.tickerItems;
    return items[this.tickerIndex() % items.length];
  }

  onVatCheck(): void {
    if (this.vatCheckerForm.invalid) {
      this.vatCheckerStatus.set({ state: 'invalid', message: 'Enter a valid VAT/TRN number before checking.' });
      return;
    }

    const value = this.vatCheckerForm.value;
    const vatNumber = (value.vatNumber ?? '').toString().toUpperCase();
    const checksum = Array.from(vatNumber).reduce((total, char, index) => {
      const code = char.charCodeAt(0);
      return total + ((index % 2 === 0 ? code * 3 : code * 7) % 97);
    }, 0);

    const isValid = checksum % 11 === 0;
    this.vatCheckerStatus.set({
      state: isValid ? 'valid' : 'invalid',
      message: isValid
        ? 'VAT registration pattern looks correct. Archive this check in your compliance log.'
        : 'Number failed checksum heuristics. Double-check with the issuing authority.'
    });
  }

  onJurisdictionChange(jurisdiction: string): void {
    const presets: Record<string, number> = {
      sa: 15,
      ae: 5,
      bh: 10,
      kw: 0,
      qa: 5
    };

    const vatRate = presets[jurisdiction] ?? (this.vatCalculatorForm.value.vatRate ?? 0);
    this.vatCalculatorForm.patchValue({ vatRate }, { emitEvent: true });
  }

  provisionWidth(): number {
    const summary = this.vatSummary();
    if (!summary.vatDue) {
      return 0;
    }

    const width = (summary.monthlyProvision / summary.vatDue) * 100;
    return Math.min(100, Math.max(10, Number(width.toFixed(2))));
  }

  private rotateTicker(): void {
    const items = this.tickerItems.map((item, index) => {
      const previous = item.price;
      const drift = (Math.random() - 0.5) * (index === 3 ? 600 : index === 4 ? 1.2 : 0.12);
      const price = Number((previous + drift).toFixed(index === 3 ? 0 : 2));
      const change = Number(((price - previous) / (previous || price) * 100).toFixed(2));
      return {
        ...item,
        previous: price,
        price,
        change
      };
    });

    this.tickerData.set(items);
    this.tickerIndex.update(index => (index + 1) % items.length);
  }

  private updateVatSummary(): void {
    const netAmount = Number(this.vatCalculatorForm.value.netAmount ?? 0);
    const vatRate = Number(this.vatCalculatorForm.value.vatRate ?? 0);

    const vatDue = Number(((netAmount * vatRate) / 100).toFixed(2));
    const grossAmount = Number((netAmount + vatDue).toFixed(2));
    const monthlyProvision = Number((vatDue / 3).toFixed(2));
    const quarterlyProvision = Number((vatDue).toFixed(2));

    this.vatSummary.set({
      vatDue,
      grossAmount,
      netAmount,
      monthlyProvision,
      quarterlyProvision
    });
  }
}
