import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-marketing-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './marketing-landing.component.html'
})
export class MarketingLandingPage {
  private title = inject(Title);
  private meta = inject(Meta);
  private sanitizer = inject(DomSanitizer);

  features = [
    {
      title: 'Sales, storage & reporting in one place',
      description: 'Manage live POS operations, reconcile inventory and produce tax-ready reports in minutes.'
    },
    {
      title: 'Supabase ready architecture',
      description: 'Every screen is designed to plug directly into Supabase Auth, Database and Functions when you connect.'
    },
    {
      title: 'Tailored for GCC retailers',
      description: 'Arabic-enabled receipts, KSA VAT defaults and Mada-ready payment splits make onboarding smooth.'
    }
  ];

  highlights = [
    'Realtime dashboards built with Angular 17 and Material 3',
    'Inventory calculators to forecast margins and tax exposure',
    'Role-based access to keep finance teams and cashiers aligned',
    'Works across tablet and desktop with offline support planned'
  ];

  readonly salesTrend: ReadonlyArray<{ label: string; amount: number }> = [
    { label: '10:00', amount: 8200 },
    { label: '11:00', amount: 9600 },
    { label: '12:00', amount: 7800 },
    { label: '13:00', amount: 11240 },
    { label: '14:00', amount: 10480 },
    { label: '15:00', amount: 12650 },
    { label: '16:00', amount: 11980 }
  ];

  private readonly peakSalesAmount = this.salesTrend.reduce((max, point) => Math.max(max, point.amount), 0);

  schemaMarkup: SafeHtml;

  constructor() {
    this.title.setTitle('Hassib POS | Cloud Retail Platform for Modern Stores');
    this.meta.addTags([
      { name: 'description', content: 'Hassib gives retail teams a fast POS, real-time inventory analytics and ready-to-connect Supabase authentication.' },
      { name: 'keywords', content: 'Hassib POS, retail inventory, GCC POS, Supabase, sales dashboard' },
      { property: 'og:title', content: 'Hassib POS – Retail operations in one place' },
      { property: 'og:description', content: 'Launch a modern POS with inventory management, VAT tools and Supabase-ready authentication.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://app.hassib.dev/' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Hassib POS | Modern Retail HQ' },
      { name: 'twitter:description', content: 'From sales to storage—Hassib centralises everything for ambitious retailers.' }
    ], true);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Hassib POS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Hassib is a cloud-based POS and inventory management platform built for GCC retailers.',
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/PreOrder',
        price: '0',
        priceCurrency: 'USD'
      },
      creator: {
        '@type': 'Organization',
        name: 'Hassib'
      }
    };

    this.schemaMarkup = this.sanitizer.bypassSecurityTrustHtml(JSON.stringify(schema));
  }

  trendHeight(value: number): number {
    if (!this.peakSalesAmount) {
      return 0;
    }

    const percentage = (value / this.peakSalesAmount) * 100;
    return Math.min(100, Math.max(8, Math.round(percentage)));
  }
}
