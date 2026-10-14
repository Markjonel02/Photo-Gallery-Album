import { supabase } from '@/lib/supabase';
import type { Album, AlbumRow } from '@/types/album';
import { sanitizeSearchTerm } from '@/utils/search';
import { mapAlbum } from './mappers';
import { storageService } from './storageService';

export const albumService = {
  async list(search?: string): Promise<Album[]> {
    let query = supabase
      .from('albums')
      .select('*, photos(count)')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    const term = search ? sanitizeSearchTerm(search) : '';
    if (term) query = query.ilike('name', `%${term}%`);

    const { data, error } = await query.returns<AlbumRow[]>();
    if (error) throw error;

    const rows = data ?? [];
    const urls = await storageService.getSignedUrls(
      rows.map((r) => r.cover_photo_path).filter((p): p is string => Boolean(p)),
    );
    return rows.map((r) => mapAlbum(r, urls));
  },

  async create(input: { name: string; description: string }): Promise<void> {
    const { error } = await supabase.from('albums').insert(input);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reorder_albums', { p_ids: orderedIds });
    if (error) throw error;
  },
};
