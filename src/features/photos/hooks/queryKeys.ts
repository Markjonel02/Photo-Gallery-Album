import type { PhotoFilters } from '@/types/photo';

export const photoKeys = {
  all: (uid: string) => ['photos', uid] as const,
  list: (uid: string, filters: PhotoFilters) => ['photos', uid, 'list', filters] as const,
  lists: (uid: string) => ['photos', uid, 'list'] as const,
  stats: (uid: string) => ['photos', uid, 'stats'] as const,
};

export const albumKeys = {
  all: (uid: string) => ['albums', uid] as const,
  list: (uid: string, search: string) => ['albums', uid, 'list', search] as const,
};
