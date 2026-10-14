import type { PhotoCategory } from './photo';

export type TabId = 'photos' | 'albums' | 'explore' | 'favorites';

/** Filters handed from one tab to another (e.g. Explore → Photos). */
export interface PhotosScope {
  albumId?: string;
  albumName?: string;
  category?: PhotoCategory;
  tag?: string;
}
