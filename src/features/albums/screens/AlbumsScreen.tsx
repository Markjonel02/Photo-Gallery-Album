import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { ArrowUpDown, FolderPlus, FolderKanban } from 'lucide-react-native';
import { Button, EmptyState, IconButton, ReorderableList, ScreenHeader, SearchInput } from '@/components/ui';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useResponsive } from '@/hooks/useResponsive';
import type { Album } from '@/types/album';
import { colors, TAB_BAR_HEIGHT } from '@/theme';
import { pluralize } from '@/utils/format';
import { toUserMessage } from '@/utils/errors';
import { AlbumCreateSheet } from '../components/AlbumCreateSheet';
import { AlbumRow } from '../components/AlbumRow';
import { useAlbums, useDeleteAlbum, useReorderAlbums } from '../hooks/useAlbums';

interface AlbumsScreenProps {
  onOpenAlbum: (album: Album) => void;
}

export function AlbumsScreen({ onOpenAlbum }: AlbumsScreenProps) {
  const { input, setInput, term, isTyping } = useDebouncedSearch();
  const [isReordering, setIsReordering] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { insets, contentWidth } = useResponsive();

  const { data: albums = [], isLoading, isFetching, refetch } = useAlbums(term);
  const deleteAlbum = useDeleteAlbum();
  const reorderAlbums = useReorderAlbums();
  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + 24;

  const confirmDelete = (album: Album) =>
    Alert.alert('Delete album?', `"${album.name}" will be removed. Its photos are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAlbum.mutate(album.id, { onError: (e) => Alert.alert('Could not delete', toUserMessage(e)) }),
      },
    ]);

  const renderBody = () => {
    if (isLoading) return <ActivityIndicator style={styles.loader} color={colors.accent} />;
    if (albums.length === 0) {
      return (
        <EmptyState
          icon={<FolderKanban size={36} color={colors.textFaint} />}
          title={term ? 'No albums match' : 'No albums yet'}
          message={term ? 'Try a different search.' : 'Create an album to organise your photos.'}
          action={term ? undefined : <Button label="New album" onPress={() => setIsCreateOpen(true)} icon={<FolderPlus size={16} color={colors.white} />} />}
        />
      );
    }
    if (isReordering) {
      return (
        <ReorderableList
          data={albums}
          contentPaddingBottom={bottomPadding}
          onReorder={(next) =>
            reorderAlbums.mutate(next.map((a) => a.id), { onError: (e) => Alert.alert('Could not save order', toUserMessage(e)) })
          }
          renderItem={(album, drag, isActive) => <AlbumRow album={album} drag={drag} isActive={isActive} />}
        />
      );
    }
    return (
      <FlatList
        data={albums}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AlbumRow album={item} onPress={onOpenAlbum} onLongPress={confirmDelete} />}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding, width: contentWidth }]}
        refreshing={isFetching && !isLoading}
        onRefresh={() => void refetch()}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Albums"
        subtitle={pluralize(albums.length, 'collection')}
        right={
          <>
            <IconButton
              label={isReordering ? 'Finish arranging' : 'Arrange albums'}
              icon={<ArrowUpDown size={16} color={isReordering ? colors.white : colors.textMuted} />}
              text={isReordering ? 'Done' : 'Arrange'}
              active={isReordering}
              onPress={() => setIsReordering((v) => !v)}
            />
            <IconButton label="New album" tone="primary" icon={<FolderPlus size={18} color={colors.white} />} onPress={() => setIsCreateOpen(true)} />
          </>
        }
      />
      {!isReordering && (
        <View style={styles.search}>
          <SearchInput value={input} onChangeText={setInput} placeholder="Search albums…" busy={isTyping} />
        </View>
      )}
      <View style={styles.body}>{renderBody()}</View>
      <AlbumCreateSheet visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { marginHorizontal: 14, marginBottom: 8 },
  body: { flex: 1 },
  list: { paddingHorizontal: 14, alignSelf: 'center' },
  loader: { marginTop: 40 },
});
