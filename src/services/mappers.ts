import type { Photo, PhotoRow } from '@/types/photo';
import type { Album, AlbumRow } from '@/types/album';

export function mapPhoto(row: PhotoRow, urls: Record<string, string>): Photo {
  return {
    id: row.id,
    albumId: row.album_id,
    storagePath: row.storage_path,
    url: urls[row.storage_path] ?? '',
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    isFavorite: row.is_favorite,
    sortOrder: Number(row.sort_order),
    location: row.location,
    takenAt: row.taken_at,
    metadata: {
      camera: row.camera,
      lens: row.lens,
      focalLength: row.focal_length,
      aperture: row.aperture,
      iso: row.iso,
      shutterSpeed: row.shutter_speed,
      width: row.width,
      height: row.height,
      fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
    },
  };
}

export function mapAlbum(row: AlbumRow, urls: Record<string, string>): Album {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverPath: row.cover_photo_path,
    coverUrl: row.cover_photo_path ? urls[row.cover_photo_path] ?? null : null,
    photoCount: row.photos?.[0]?.count ?? 0,
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
  };
}
