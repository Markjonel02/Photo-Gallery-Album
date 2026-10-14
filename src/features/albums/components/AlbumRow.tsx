import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import type { Album } from '@/types/album';
import { RemoteImage } from '@/components/ui';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { formatDate, pluralize } from '@/utils/format';

interface AlbumRowProps {
  album: Album;
  onPress?: (album: Album) => void;
  onLongPress?: (album: Album) => void;
  drag?: () => void;
  isActive?: boolean;
}

export function AlbumRow({ album, onPress, onLongPress, drag, isActive }: AlbumRowProps) {
  const reordering = Boolean(drag);
  return (
    <Pressable
      onPress={reordering ? undefined : () => onPress?.(album)}
      onLongPress={reordering ? drag : () => onLongPress?.(album)}
      accessibilityRole="button"
      accessibilityLabel={`${album.name}, ${pluralize(album.photoCount, 'photo')}`}
      accessibilityHint={reordering ? 'Long press and drag to reorder' : 'Long press to delete'}
      style={[styles.card, isActive && styles.active]}
    >
      <RemoteImage url={album.coverUrl} cacheKey={album.coverPath} style={styles.cover} />
      <View style={styles.info}>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.name} numberOfLines={1}>{album.name}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.meta}>
          {pluralize(album.photoCount, 'photo')} · {formatDate(album.createdAt)}
        </Text>
        {album.description ? (
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.desc} numberOfLines={2}>{album.description}</Text>
        ) : null}
      </View>
      {reordering ? (
        <Pressable onPressIn={drag} hitSlop={12} accessibilityLabel="Drag handle">
          <GripVertical size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 10, marginBottom: 10, gap: 12 },
  active: { backgroundColor: colors.borderStrong },
  cover: { width: 72, height: 72, borderRadius: radius.md },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  desc: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 4, lineHeight: 16 },
});
