import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { albumService } from '@/services/albumService';
import { useUserId } from '@/features/auth/AuthContext';
import { albumKeys, photoKeys } from '@/features/photos/hooks/queryKeys';

export function useAlbums(search = '') {
  const uid = useUserId();
  return useQuery({
    queryKey: albumKeys.list(uid, search),
    queryFn: () => albumService.list(search),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: albumService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: albumKeys.all(uid) }),
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: (id: string) => albumService.remove(id),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: albumKeys.all(uid) }),
        qc.invalidateQueries({ queryKey: photoKeys.all(uid) }),
      ]),
  });
}

export function useReorderAlbums() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: (orderedIds: string[]) => albumService.reorder(orderedIds),
    onSettled: () => qc.invalidateQueries({ queryKey: albumKeys.all(uid) }),
  });
}
