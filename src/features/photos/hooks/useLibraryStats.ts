import { useQuery } from '@tanstack/react-query';
import { photoService } from '@/services/photoService';
import { useUserId } from '@/features/auth/AuthContext';
import { photoKeys } from './queryKeys';

export function useLibraryStats() {
  const uid = useUserId();
  return useQuery({ queryKey: photoKeys.stats(uid), queryFn: () => photoService.stats() });
}
