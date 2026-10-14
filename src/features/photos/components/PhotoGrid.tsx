import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { Photo } from '@/types/photo';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme';
import { PhotoCard } from './PhotoCard';

const GUTTER = 8;

interface PhotoGridProps {
  photos: Photo[];
  onPhotoPress: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo) => void;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  bottomPadding: number;
}

export function PhotoGrid({
  photos,
  onPhotoPress,
  onToggleFavorite,
  onEndReached,
  isFetchingNextPage,
  isRefreshing,
  onRefresh,
  bottomPadding,
}: PhotoGridProps) {
  const { columns, contentWidth } = useResponsive();
  const cardSize = Math.floor((contentWidth - GUTTER * (columns + 1)) / columns);

  const renderItem = useCallback(
    ({ item }: { item: Photo }) => (
      <PhotoCard photo={item} size={cardSize} onPress={onPhotoPress} onToggleFavorite={onToggleFavorite} />
    ),
    [cardSize, onPhotoPress, onToggleFavorite],
  );

  return (
    <FlatList
      // Changing numColumns on the fly requires a fresh list (rotation / split-screen).
      key={columns}
      data={photos}
      numColumns={columns}
      keyExtractor={(p) => p.id}
      renderItem={renderItem}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      initialNumToRender={columns * 4}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: GUTTER, alignSelf: 'center' },
  row: { gap: GUTTER, paddingHorizontal: GUTTER, marginBottom: GUTTER },
  footer: { marginVertical: 16 },
});
