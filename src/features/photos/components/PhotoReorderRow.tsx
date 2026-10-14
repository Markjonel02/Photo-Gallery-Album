import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import type { Photo } from '@/types/photo';
import { RemoteImage } from '@/components/ui';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { formatDate } from '@/utils/format';

interface PhotoReorderRowProps {
  photo: Photo;
  drag: () => void;
  isActive: boolean;
}

export function PhotoReorderRow({ photo, drag, isActive }: PhotoReorderRowProps) {
  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={150}
      accessibilityLabel={`${photo.title}. Long press and drag to reorder.`}
      style={[styles.row, isActive && styles.active]}
    >
      <RemoteImage url={photo.url} cacheKey={photo.storagePath} style={styles.thumb} />
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title} numberOfLines={1}>{photo.title}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.meta} numberOfLines={1}>{formatDate(photo.takenAt)}</Text>
      </View>
      <Pressable onPressIn={drag} hitSlop={12} accessibilityLabel="Drag handle">
        <GripVertical size={20} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, marginBottom: 8, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  active: { backgroundColor: colors.borderStrong },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  texts: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
