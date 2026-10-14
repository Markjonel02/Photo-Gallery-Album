import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown, ChevronLeft, Heart, Images, Plus } from 'lucide-react-native';
import { EmptyState, IconButton, ReorderableList, ScreenHeader, SearchInput, Button } from '@/components/ui';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useResponsive } from '@/hooks/useResponsive';
import type { Photo, PhotoFilters } from '@/types/photo';
import type { PhotosScope } from '@/types/navigation';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius, TAB_BAR_HEIGHT } from '@/theme';
import { logError, toUserMessage } from '@/utils/errors';
import { useDeletePhoto, usePhotos, useReorderPhotos, useToggleFavorite } from '../hooks/usePhotos';
import { PhotoGrid } from '../components/PhotoGrid';
import { PhotoLightbox } from '../components/PhotoLightbox';
import { PhotoReorderRow } from '../components/PhotoReorderRow';
import { UploadSheet } from '../components/UploadSheet';

interface PhotosScreenProps {
  title: string;
  favoritesOnly?: boolean;
  scope?: PhotosScope;
  onClearScope?: () => void;
}

export function PhotosScreen({ title, favoritesOnly = false, scope, onClearScope }: PhotosScreenProps) {
  const { input, setInput, term, isTyping } = useDebouncedSearch();
  const [isReordering, setIsReordering] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const { insets } = useResponsive();

  const filters = useMemo<PhotoFilters>(
    () => ({
      search: term || undefined,
      favoritesOnly: favoritesOnly || undefined,
      albumId: scope?.albumId,
      category: scope?.category,
      tag: scope?.tag,
    }),
    [term, favoritesOnly, scope?.albumId, scope?.category, scope?.tag],
  );

  const { photos, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isError } =
    usePhotos(filters);
  const toggleFavorite = useToggleFavorite();
  const deletePhoto = useDeletePhoto();
  const reorderPhotos = useReorderPhotos();

  const activePhoto = photos.find((p) => p.id === activePhotoId) ?? null;
  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + 24;
  const scopeLabel = scope?.albumName ?? scope?.category ?? (scope?.tag ? `#${scope.tag}` : null);

  const onToggleFavorite = useCallback(
    (photo: Photo) => toggleFavorite.mutate({ id: photo.id, isFavorite: !photo.isFavorite }),
    [toggleFavorite],
  );

  const confirmDelete = (photo: Photo) => {
    Alert.alert('Delete photo?', `"${photo.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deletePhoto.mutate(photo, {
            onSuccess: () => setActivePhotoId(null),
            onError: (e) => { logError('deletePhoto', e); Alert.alert('Could not delete', toUserMessage(e)); },
          }),
      },
    ]);
  };

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderBody = () => {
    if (isLoading) return <EmptyState icon={<Images size={36} color={colors.textFaint} />} title="Loading…" />;
    if (isError && photos.length === 0) {
      return (
        <EmptyState
          icon={<Images size={36} color={colors.textFaint} />}
          title="Couldn't load photos"
          message="Check your connection and try again."
          action={<Button label="Retry" onPress={() => void refetch()} />}
        />
      );
    }
    if (photos.length === 0) {
      const searching = term.length > 0;
      return (
        <EmptyState
          icon={favoritesOnly ? <Heart size={36} color={colors.textFaint} /> : <Images size={36} color={colors.textFaint} />}
          title={searching ? 'No matches' : favoritesOnly ? 'No favorites yet' : 'No photos yet'}
          message={
            searching ? 'Try a different search.' : favoritesOnly ? 'Tap the heart on a photo to save it here.' : 'Tap + to add your first photo.'
          }
        />
      );
    }
    if (isReordering) {
      return (
        <ReorderableList
          data={photos}
          contentPaddingBottom={bottomPadding}
          onReorder={(next) =>
            reorderPhotos.mutate(next.map((p) => p.id), {
              onError: (e) => Alert.alert('Could not save order', toUserMessage(e)),
            })
          }
          renderItem={(photo, drag, isActive) => <PhotoReorderRow photo={photo} drag={drag} isActive={isActive} />}
        />
      );
    }
    return (
      <PhotoGrid
        photos={photos}
        onPhotoPress={(p) => setActivePhotoId(p.id)}
        onToggleFavorite={onToggleFavorite}
        onEndReached={loadMore}
        isFetchingNextPage={isFetchingNextPage}
        isRefreshing={isFetching && !isFetchingNextPage && !isLoading}
        onRefresh={() => void refetch()}
        bottomPadding={bottomPadding}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={title}
        subtitle="Private library"
        right={
          <>
            <IconButton
              label={isReordering ? 'Finish arranging' : 'Arrange photos'}
              icon={<ArrowUpDown size={16} color={isReordering ? colors.white : colors.textMuted} />}
              text={isReordering ? 'Done' : 'Arrange'}
              active={isReordering}
              onPress={() => setIsReordering((v) => !v)}
            />
            <IconButton label="Add photo" tone="primary" icon={<Plus size={18} color={colors.white} />} onPress={() => setIsUploadOpen(true)} />
          </>
        }
      />

      {!isReordering && (
        <View style={styles.pad}>
          <SearchInput value={input} onChangeText={setInput} placeholder="Search title, camera, tag, place…" busy={isTyping || (isFetching && !isLoading && !isFetchingNextPage && term.length > 0)} />
        </View>
      )}

      {scopeLabel && onClearScope ? (
        <Pressable style={[styles.banner, styles.pad]} onPress={onClearScope} accessibilityRole="button" accessibilityLabel="Clear filter">
          <ChevronLeft size={16} color={colors.accent} />
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.bannerText} numberOfLines={1}>
            {scopeLabel} — tap to show all
          </Text>
        </Pressable>
      ) : null}

      {isReordering && (
        <View style={[styles.banner, styles.pad]}>
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.bannerText}>
            Long-press and drag to reorder{hasNextPage ? ' (loaded photos only)' : ''}
          </Text>
        </View>
      )}

      <View style={styles.body}>{renderBody()}</View>

      <PhotoLightbox photo={activePhoto} onClose={() => setActivePhotoId(null)} onToggleFavorite={onToggleFavorite} onDelete={confirmDelete} />
      <UploadSheet visible={isUploadOpen} onClose={() => setIsUploadOpen(false)} defaultAlbumId={scope?.albumId ?? null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pad: { marginHorizontal: 14 },
  body: { flex: 1, marginTop: 4 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, padding: 8, borderRadius: radius.sm,
    backgroundColor: 'rgba(56,189,248,0.1)',
  },
  bannerText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600', flexShrink: 1 },
});
