export interface Album {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  coverPath: string | null;
  photoCount: number;
  sortOrder: number;
  createdAt: string;
}

export interface AlbumRow {
  id: string;
  name: string;
  description: string;
  cover_photo_path: string | null;
  sort_order: number;
  created_at: string;
  photos?: { count: number }[];
}
