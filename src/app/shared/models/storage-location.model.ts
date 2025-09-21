export interface StorageLocation {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  created_at?: string;
}
