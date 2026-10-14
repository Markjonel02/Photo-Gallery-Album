import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import type { Photo } from '@/types/photo';
import { RemoteImage } from '@/components/ui';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { formatDate } from '@/utils/format';

interface PhotoCardProps {
  photo: Photo;
  size: number;
  onPress: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo) => void;
}

function PhotoCardBase({ photo, size, onPress, onToggleFavorite }: PhotoCardProps) {
  return (
    <Pressable
      onPress={() => onPress(photo)}
      accessibilityRole="imagebutton"
      accessibilityLabel={`${photo.title}, ${formatDate(photo.takenAt)}`}
      style={[styles.card, { width: size }]}
    >
      <RemoteImage url={photo.url} cacheKey={photo.storagePath} style={{ width: size, height: size }} />

      <Pressable
        onPress={() => onToggleFavorite(photo)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        style={[styles.fav, photo.isFavorite && styles.favActive]}
      >
        <Heart size={14} color={colors.white} fill={photo.isFavorite ? colors.favorite : 'transparent'} />
      </Pressable>

      <View style={styles.footer}>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title} numberOfLines={1}>
          {photo.title}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.meta} numberOfLines={1}>
          {formatDate(photo.takenAt)}
          {photo.location ? ` · ${photo.location}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export const PhotoCard = memo(PhotoCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface },
  fav: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favActive: { backgroundColor: colors.favorite },
  footer: { paddingHorizontal: 8, paddingVertical: 6 },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
