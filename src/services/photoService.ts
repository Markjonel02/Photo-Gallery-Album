import { supabase } from '@/lib/supabase';
import { APP_LIMITS } from '@/config/env';
import type { LibraryStats, NewPhotoInput, Photo, PhotoFilters, PhotoRow } from '@/types/photo';
import { sanitizeSearchTerm } from '@/utils/search';
import { mapPhoto } from './mappers';
import { storageService } from './storageService';

export interface PhotoPage {
  items: Photo[];
  nextPage: number | null;
}

async function withUrls(rows: PhotoRow[]): Promise<Photo[]> {
  const urls = await storageService.getSignedUrls(rows.map((r) => r.storage_path));
  return rows.map((r) => mapPhoto(r, urls));
}

export const photoService = {
  async list(filters: PhotoFilters, page: number): Promise<PhotoPage> {
    const size = APP_LIMITS.pageSize;
    const from = page * size;

    let query = supabase
      .from('photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + size); // one extra row tells us if another page exists

    if (filters.albumId) query = query.eq('album_id', filters.albumId);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.favoritesOnly) query = query.eq('is_favorite', true);
    if (filters.tag) query = query.contains('tags', [sanitizeSearchTerm(filters.tag)]);
    if (filters.search) {
      const term = sanitizeSearchTerm(filters.search);
      if (term) query = query.ilike('search_text', `%${term}%`);
    }

    const { data, error } = await query.returns<PhotoRow[]>();
    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > size;
    return { items: await withUrls(rows.slice(0, size)), nextPage: hasMore ? page + 1 : null };
  },

  async create(userId: string, input: NewPhotoInput): Promise<Photo> {
    const uploaded = await storageService.uploadImage(userId, input.localUri, input.dimensions);

    const { data, error } = await supabase
      .from('photos')
      .insert({
        storage_path: uploaded.path,
        album_id: input.albumId,
        title: input.title,
        category: input.category,
        tags: input.tags,
        location: input.location,
        taken_at: input.takenAt,
        camera: input.metadata.camera,
        lens: input.metadata.lens,
        focal_length: input.metadata.focalLength,
        aperture: input.metadata.aperture,
        iso: input.metadata.iso,
        shutter_speed: input.metadata.shutterSpeed,
        width: uploaded.width,
        height: uploaded.height,
        file_size_bytes: uploaded.sizeBytes,
      })
      .select('*')
      .single<PhotoRow>();

    if (error) {
      // Don't leave an orphaned file behind if the row couldn't be created.
      await storageService.remove([uploaded.path]).catch(() => {});
      throw error;
    }
    return (await withUrls([data]))[0];
  },

  async setFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase.from('photos').update({ is_favorite: isFavorite }).eq('id', id);
    if (error) throw error;
  },

  async moveToAlbum(id: string, albumId: string | null): Promise<void> {
    const { error } = await supabase.from('photos').update({ album_id: albumId }).eq('id', id);
    if (error) throw error;
  },

  async remove(photo: Pick<Photo, 'id' | 'storagePath'>): Promise<void> {
    const { error } = await supabase.from('photos').delete().eq('id', photo.id);
    if (error) throw error;
    await storageService.remove([photo.storagePath]).catch(() => {});
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reorder_photos', { p_ids: orderedIds });
    if (error) throw error;
  },

  async stats(): Promise<LibraryStats> {
    const { data, error } = await supabase.rpc('library_stats');
    if (error) throw error;
    return data as LibraryStats;
  },
};
