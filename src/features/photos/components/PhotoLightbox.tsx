import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Camera, Heart, HardDrive, Info, MapPin, Trash2, X } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Photo } from '@/types/photo';
import { RemoteImage } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { formatBytes, formatDate } from '@/utils/format';

interface PhotoLightboxProps {
  photo: Photo | null;
  onClose: () => void;
  onToggleFavorite: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
}

export function PhotoLightbox({ photo, onClose, onToggleFavorite, onDelete }: PhotoLightboxProps) {
  const { width, height } = useResponsive();
  const [showInfo, setShowInfo] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset zoom + sheet whenever a different photo opens.
  useEffect(() => {
    scale.value = 1; savedScale.value = 1;
    tx.value = 0; ty.value = 0; savedTx.value = 0; savedTy.value = 0;
    setShowInfo(false);
  }, [photo?.id, scale, savedScale, tx, ty, savedTx, savedTy]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5); })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        tx.value = withTiming(0); ty.value = withTiming(0); savedTx.value = 0; savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      }
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomIn = scale.value <= 1;
      scale.value = withTiming(zoomIn ? 2.5 : 1);
      savedScale.value = zoomIn ? 2.5 : 1;
      if (!zoomIn) { tx.value = withTiming(0); ty.value = withTiming(0); savedTx.value = 0; savedTy.value = 0; }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  if (!photo) return null;
  const m = photo.metadata;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root}>
          <View style={styles.topBar}>
            <Pressable onPress={onClose} style={styles.iconButton} accessibilityLabel="Close photo">
              <X size={22} color={colors.white} />
            </Pressable>

            <View style={styles.titles}>
              <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title} numberOfLines={1}>{photo.title}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.subtitle}>{formatDate(photo.takenAt)}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => onToggleFavorite(photo)} style={styles.iconButton} accessibilityLabel={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <Heart size={20} color={photo.isFavorite ? colors.favorite : colors.white} fill={photo.isFavorite ? colors.favorite : 'transparent'} />
              </Pressable>
              <Pressable onPress={() => setShowInfo((v) => !v)} style={[styles.iconButton, showInfo && styles.iconButtonActive]} accessibilityLabel="Photo details">
                <Info size={20} color={colors.white} />
              </Pressable>
              <Pressable onPress={() => onDelete(photo)} style={styles.iconButton} accessibilityLabel="Delete photo">
                <Trash2 size={20} color={colors.danger} />
              </Pressable>
            </View>
          </View>

          <View style={styles.stage}>
            <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
              <Animated.View style={animatedStyle}>
                <RemoteImage
                  url={photo.url}
                  cacheKey={photo.storagePath}
                  contentFit="contain"
                  style={{ width, height: height * 0.72, backgroundColor: colors.black }}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          {showInfo && (
            <View style={styles.sheet}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.sheetTitle}>Details</Text>

                <Row icon={<Camera size={16} color={colors.textMuted} />} label="Camera & lens"
                  value={[m.camera, m.lens].filter(Boolean).join(' · ') || '—'} />

                <View style={styles.specs}>
                  <Spec label="Focal" value={m.focalLength} />
                  <Spec label="Aperture" value={m.aperture} />
                  <Spec label="Shutter" value={m.shutterSpeed} />
                  <Spec label="ISO" value={m.iso ? String(m.iso) : null} />
                </View>

                <Row icon={<HardDrive size={16} color={colors.textMuted} />} label="Resolution & file"
                  value={`${m.width ?? '—'} × ${m.height ?? '—'} · ${formatBytes(m.fileSizeBytes)}`} />

                {photo.location ? (
                  <Row icon={<MapPin size={16} color={colors.textMuted} />} label="Location" value={photo.location} />
                ) : null}

                <View style={styles.tags}>
                  {photo.tags.map((tag) => (
                    <View key={tag} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.rowLabel}>{label}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.spec}>
      <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.specLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.specValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, zIndex: 10 },
  titles: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 14, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 18, maxHeight: 280, borderWidth: 1, borderColor: colors.borderStrong },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rowLabel: { fontSize: 10, color: colors.textFaint, textTransform: 'uppercase' },
  rowValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSoft, marginTop: 1 },
  specs: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 10, marginVertical: 8 },
  spec: { alignItems: 'center' },
  specLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  specValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: fontSize.xs, color: colors.primaryText },
});
