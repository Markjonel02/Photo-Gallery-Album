import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { photoService, type PhotoPage } from '@/services/photoService';
import type { NewPhotoInput, Photo, PhotoFilters } from '@/types/photo';
import { useUserId } from '@/features/auth/AuthContext';
import { albumKeys, photoKeys } from './queryKeys';

type PhotoPages = InfiniteData<PhotoPage, number>;

export function usePhotos(filters: PhotoFilters) {
  const uid = useUserId();
  const query = useInfiniteQuery({
    queryKey: photoKeys.list(uid, filters),
    queryFn: ({ pageParam }) => photoService.list(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    placeholderData: keepPreviousData,
  });
  const photos = query.data?.pages.flatMap((p) => p.items) ?? [];
  return { ...query, photos };
}

/** Refresh everything a photo change can affect. */
function useInvalidateLibrary() {
  const qc = useQueryClient();
  const uid = useUserId();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: photoKeys.all(uid) }),
      qc.invalidateQueries({ queryKey: albumKeys.all(uid) }),
    ]);
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const uid = useUserId();
  const invalidate = useInvalidateLibrary();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      photoService.setFavorite(id, isFavorite),
    // Optimistic: flip the heart instantly in every cached list.
    onMutate: async ({ id, isFavorite }) => {
      await qc.cancelQueries({ queryKey: photoKeys.lists(uid) });
      const snapshots = qc.getQueriesData<PhotoPages>({ queryKey: photoKeys.lists(uid) });
      qc.setQueriesData<PhotoPages>({ queryKey: photoKeys.lists(uid) }, (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((p) => (p.id === id ? { ...p, isFavorite } : p)),
          })),
        },
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  });
}

export function useCreatePhoto() {
  const uid = useUserId();
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (input: NewPhotoInput) => photoService.create(uid, input),
    onSuccess: invalidate,
  });
}

export function useDeletePhoto() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (photo: Pick<Photo, 'id' | 'storagePath'>) => photoService.remove(photo),
    onSuccess: invalidate,
  });
}

export function useReorderPhotos() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (orderedIds: string[]) => photoService.reorder(orderedIds),
    onSettled: invalidate,
  });
}
