import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlbumsScreen } from '@/features/albums/screens/AlbumsScreen';
import { ExploreScreen } from '@/features/explore/screens/ExploreScreen';
import { PhotosScreen } from '@/features/photos/screens/PhotosScreen';
import type { PhotosScope, TabId } from '@/types/navigation';
import { TabBar } from './TabBar';

/** Signed-in shell: one active tab plus an optional filter handed between tabs. */
export function MainTabs() {
  const [tab, setTab] = useState<TabId>('photos');
  const [scope, setScope] = useState<PhotosScope>({});

  const selectTab = useCallback((next: TabId) => {
    setScope({});
    setTab(next);
  }, []);

  const openPhotos = useCallback((next: PhotosScope) => {
    setScope(next);
    setTab('photos');
  }, []);

  return (
    <View style={styles.container}>
      {tab === 'photos' && (
        // key forces a fresh search box / reorder state when the scope changes
        <PhotosScreen
          key={`${scope.albumId ?? ''}|${scope.category ?? ''}|${scope.tag ?? ''}`}
          title="Photos"
          scope={scope}
          onClearScope={() => setScope({})}
        />
      )}
      {tab === 'favorites' && <PhotosScreen title="Favorites" favoritesOnly />}
      {tab === 'albums' && (
        <AlbumsScreen onOpenAlbum={(album) => openPhotos({ albumId: album.id, albumName: album.name })} />
      )}
      {tab === 'explore' && <ExploreScreen onOpenPhotos={openPhotos} onOpenFavorites={() => selectTab('favorites')} />}
      <TabBar active={tab} onSelect={selectTab} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
