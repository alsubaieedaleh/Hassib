
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, Meta, Title, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { auditTime, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private title = inject(Title);
  private meta = inject(Meta);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  private document = inject(DOCUMENT);
  private tickerTimer?: ReturnType<typeof setInterval>;

  readonly navSections = [
    { label: 'Tools', href: '#tools' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'FAQ', href: '#faq' },
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
      description: 'Angular SSR-first rendering, Tailwind UI primitives and built-in localisation for GCC teams.'
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

  readonly faqItems = [
    {
      question: 'How does Hassib help GCC traders stay VAT compliant?',
      answer: 'Hassib automates VAT rate presets per jurisdiction, reconciles live desk activity with retail POS data and produces audit-ready ledgers across Saudi Arabia, the UAE, Bahrain, Kuwait and Qatar.'
    },
    {
      question: 'Can we deploy Hassib alongside our existing Supabase stack?',
      answer: 'Yes. Hassib reuses Supabase authentication, policies and storage buckets so your developers only wire business logic while traders receive instant access to dashboards and alerts.'
    },
    {
      question: 'Is the platform optimised for search and fast first contentful paint?',
      answer: 'The landing page ships with Angular Universal-ready rendering, structured data, preloaded hero content and Tailwind-tuned components so crawlers and decision makers see the value immediately.'
    },
    {
      question: 'Do finance leads get reporting exports for auditors?',
      answer: 'Scheduled CSV, XLSX and Supabase function exports are available out of the box, giving auditors snapshots of VAT due, provisioning schedules and compliance checks in a single workspace.'
    }
  ];

  private tickerData = signal([
    { pair: 'XAU/SAR', price: 7421.23, change: 0.8 },
    { pair: 'USD/SAR', price: 3.75, change: -0.02 },
    { pair: 'EUR/SAR', price: 4.06, change: 0.12 },
    { pair: 'BTC/SAR', price: 262350.0, change: 1.6 },
    { pair: 'Brent', price: 82.14, change: -0.45 }
  ].map(item => ({ ...item, previous: item.price })));

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

  private readonly vatCalculatorState = toSignal(
    this.vatCalculatorForm.valueChanges.pipe(startWith(this.vatCalculatorForm.value), auditTime(50)),
    { initialValue: this.vatCalculatorForm.value }
  );

  readonly vatSummary = computed(() => {
    const formValue = this.vatCalculatorState();
    const netAmount = Number(formValue?.netAmount ?? 0);
    const vatRate = Number(formValue?.vatRate ?? 0);
    const vatDue = Number(((netAmount * vatRate) / 100).toFixed(2));
    const grossAmount = Number((netAmount + vatDue).toFixed(2));
    const monthlyProvision = Number((vatDue / 3).toFixed(2));
    const quarterlyProvision = vatDue;
    return { vatDue, grossAmount, netAmount, monthlyProvision, quarterlyProvision };
  });

  readonly jurisdictionLabel = computed(() =>
    (this.vatCalculatorState()?.jurisdiction ?? 'sa').toString().toUpperCase()
  );

  readonly vatCheckerStatus = signal<{ state: 'idle' | 'valid' | 'invalid'; message: string }>({
    state: 'idle',
    message: ''
  });

  readonly currentYear = new Date().getFullYear();

  schemaMarkup: SafeHtml | undefined;
  structuredDataJson = '';

  constructor() {
    const pageTitle = 'Hassib VAT Suite | GCC Trader Compliance & POS Platform';
    const pageDescription = 'Hassib VAT Suite unifies GCC POS, live trading analytics and automated VAT workflows.';

    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:url', content: 'https://app.hassib.dev/landing' });
    this.title.setTitle(pageTitle);
    this.ensureCanonicalLink('https://app.hassib.dev/landing');
    this.buildStructuredData();
    this.vatCheckerForm.valueChanges
      .pipe(startWith(this.vatCheckerForm.value), auditTime(0), takeUntilDestroyed())
      .subscribe(() => {
        if (this.vatCheckerStatus().state !== 'idle') {
          this.vatCheckerStatus.set({ state: 'idle', message: '' });
        }
      });
  }

  ngOnInit(): void {
    this.tickerTimer = setInterval(() => this.rotateTicker(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickerTimer) clearInterval(this.tickerTimer);
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

    const vatNumber = (this.vatCheckerForm.value.vatNumber ?? '').toString().toUpperCase();
    const checksum = Array.from(vatNumber).reduce((acc, char, index) => {
      const code = char.charCodeAt(0);
      return acc + ((index % 2 === 0 ? code * 3 : code * 7) % 97);
    }, 0);

    const isValid = checksum % 11 === 0;
    this.vatCheckerStatus.set({
      state: isValid ? 'valid' : 'invalid',
      message: isValid
        ? 'VAT registration pattern looks correct.'
        : 'Number failed checksum heuristics.'
    });
  }

  onJurisdictionChange(jurisdiction: string): void {
    const presets: Record<string, number> = { sa: 15, ae: 5, bh: 10, kw: 0, qa: 5 };
    const vatRate = presets[jurisdiction] ?? this.vatCalculatorForm.value.vatRate ?? 0;
    this.vatCalculatorForm.patchValue({ vatRate }, { emitEvent: true });
  }

  provisionWidth(): number {
    const summary = this.vatSummary();
    if (!summary.vatDue) return 0;
    const width = (summary.monthlyProvision / summary.vatDue) * 100;
    return Math.min(100, Math.max(10, Number(width.toFixed(2))));
  }

  private ensureCanonicalLink(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private rotateTicker(): void {
    const items = this.tickerItems.map((item, index) => {
      const previous = item.price;
      const drift = (Math.random() - 0.5) * (index === 3 ? 600 : index === 4 ? 1.2 : 0.12);
      const price = Number((previous + drift).toFixed(index === 3 ? 0 : 2));
      const change = Number(((price - previous) / (previous || 1) * 100).toFixed(2));
      return { ...item, previous: price, price, change };
    });
    this.tickerData.set(items);
    this.tickerIndex.update(i => (i + 1) % items.length);
  }

  private buildStructuredData(): void {
    const faqEntities = this.faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }));

    const structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Hassib VAT Suite',
        url: 'https://app.hassib.dev/landing',
        description:
          'Hassib VAT Suite unifies GCC POS, live trading analytics and automated VAT workflows.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      },
    ];

    this.structuredDataJson = JSON.stringify(structuredData);
    this.schemaMarkup = this.sanitizer.bypassSecurityTrustHtml(this.structuredDataJson);
  }
}
