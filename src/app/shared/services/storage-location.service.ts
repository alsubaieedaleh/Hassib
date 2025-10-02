import { Injectable, Signal, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { StorageLocation } from '../models/storage-location.model';

@Injectable({ providedIn: 'root' })
export class StorageLocationService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'storage_locations';

  private readonly locationsSignal = signal<StorageLocation[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  constructor() {
    void this.refresh();
  }

  locations(): Signal<StorageLocation[]> {
    return this.locationsSignal.asReadonly();
  }

  loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  async refresh(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.locationsSignal.set([]);
      const configError = this.supabase.configurationError();
      this.errorSignal.set(configError ? configError() : 'Supabase configuration missing.');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const client = this.supabase.ensureClient();
      const userId = await this.supabase.getAuthenticatedUserId();

      if (!userId) {
        this.locationsSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      const { data, error } = await client
        .from(this.table)
        .select('id, name, code, address, created_at')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const mapped = (data ?? []).map((row: unknown) => this.mapRow(row));
      this.locationsSignal.set(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load storage locations.';
      this.errorSignal.set(message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async ensureSeedLocation(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      return;
    }

    if (this.locationsSignal().length > 0) {
      return;
    }

    const client = this.supabase.ensureClient();
    const userId = await this.supabase.getAuthenticatedUserId();

    if (!userId) {
      return;
    }

    try {
      const { data, error } = await client
        .from(this.table)
        .select('id, name, code, address, created_at')
        .eq('user_id', userId)
        .order('id', { ascending: true })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length) {
        this.locationsSignal.set(data.map((row: unknown) => this.mapRow(row)));
        return;
      }

      const { data: inserted, error: insertError } = await client
        .from(this.table)
        .insert({ name: 'Main Warehouse', code: 'MAIN', user_id: userId })
        .select('id, name, code, address, created_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      if (inserted) {
        this.locationsSignal.set([this.mapRow(inserted)]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create a default storage location.';
      this.errorSignal.set(message);
    }
  }

  async createLocation(payload: { name: string; code?: string; address?: string }): Promise<StorageLocation> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const userId = await this.supabase.requireAuthenticatedUserId();
    const { data, error } = await client
      .from(this.table)
      .insert({
        name: payload.name,
        code: payload.code?.trim() || null,
        address: payload.address?.trim() || null,
        user_id: userId,
      })
      .select('id, name, code, address, created_at')
      .single();

    if (error) {
      throw error;
    }

    const mapped = this.mapRow(data);
    this.locationsSignal.update(prev => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  }

  private mapRow(row: any): StorageLocation {
    return {
      id: Number(row.id) || 0,
      name: row.name ?? '',
      code: row.code ?? null,
      address: row.address ?? null,
      created_at: row.created_at ?? undefined,
    } satisfies StorageLocation;
  }
}
