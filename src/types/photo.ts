export const PHOTO_CATEGORIES = [
  'nature',
  'architecture',
  'travel',
  'street',
  'portraits',
  'minimal',
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface PhotoMetadata {
  camera: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  iso: number | null;
  shutterSpeed: string | null;
  width: number | null;
  height: number | null;
  fileSizeBytes: number | null;
}

/** App-level photo model (camelCase, with a resolved signed URL). */
export interface Photo {
  id: string;
  albumId: string | null;
  storagePath: string;
  url: string;
  title: string;
  description: string | null;
  category: PhotoCategory;
  tags: string[];
  isFavorite: boolean;
  sortOrder: number;
  location: string | null;
  takenAt: string;
  metadata: PhotoMetadata;
}

/** Database row shape (snake_case) as returned by PostgREST. */
export interface PhotoRow {
  id: string;
  album_id: string | null;
  storage_path: string;
  title: string;
  description: string | null;
  category: PhotoCategory;
  tags: string[];
  is_favorite: boolean;
  sort_order: number;
  location: string | null;
  taken_at: string;
  camera: string | null;
  lens: string | null;
  focal_length: string | null;
  aperture: string | null;
  iso: number | null;
  shutter_speed: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
}

export interface PhotoFilters {
  search?: string;
  category?: PhotoCategory;
  tag?: string;
  albumId?: string;
  favoritesOnly?: boolean;
}

export interface NewPhotoInput {
  localUri: string;
  /** Picker-reported size; only used as a cheap pre-decode sanity cap. */
  dimensions?: { width?: number; height?: number };
  title: string;
  category: PhotoCategory;
  tags: string[];
  location: string | null;
  albumId: string | null;
  takenAt: string;
  metadata: Omit<PhotoMetadata, 'width' | 'height' | 'fileSizeBytes'>;
}

export interface LibraryStats {
  total: number;
  favorites: number;
  categories: Partial<Record<PhotoCategory, number>>;
  cameras: Record<string, number>;
  tags: string[];
}
