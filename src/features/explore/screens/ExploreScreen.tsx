import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building, Camera, Compass, Heart, Images, LogOut, Mountain, Sparkles, UserRound } from 'lucide-react-native';
import { Alert } from 'react-native';
import { Button, Chip, ScreenHeader, SearchInput } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useLibraryStats } from '@/features/photos/hooks/useLibraryStats';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useResponsive } from '@/hooks/useResponsive';
import type { PhotoCategory } from '@/types/photo';
import type { PhotosScope } from '@/types/navigation';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius, TAB_BAR_HEIGHT } from '@/theme';
import { logError, toUserMessage } from '@/utils/errors';

interface ExploreScreenProps {
  onOpenPhotos: (scope: PhotosScope) => void;
  onOpenFavorites: () => void;
}

const CATEGORY_CARDS: { id: PhotoCategory; label: string; Icon: typeof Compass }[] = [
  { id: 'travel', label: 'Travel', Icon: Compass },
  { id: 'nature', label: 'Nature', Icon: Mountain },
  { id: 'architecture', label: 'Architecture', Icon: Building },
  { id: 'street', label: 'Street', Icon: Camera },
  { id: 'portraits', label: 'Portraits', Icon: UserRound },
  { id: 'minimal', label: 'Minimalist', Icon: Sparkles },
];

export function ExploreScreen({ onOpenPhotos, onOpenFavorites }: ExploreScreenProps) {
  const { data: stats, isLoading } = useLibraryStats();
  const { user, signOut } = useAuth();
  const { input, setInput, term } = useDebouncedSearch();
  const { insets, contentWidth, columns } = useResponsive();

  const visibleTags = useMemo(
    () => (stats?.tags ?? []).filter((t) => !term || t.includes(term)),
    [stats?.tags, term],
  );
  const cardWidth = Math.floor((contentWidth - 32 - 10 * (columns - 1)) / Math.min(columns, 3));
  const cameras = Object.entries(stats?.cameras ?? {});

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut().catch((e) => { logError('signOut', e); Alert.alert('Could not sign out', toUserMessage(e)); }) },
    ]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Explore" subtitle="Smart categories & gear" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24, width: contentWidth }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}

        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.heading}>Categories</Text>
        <View style={styles.grid}>
          <Card width={cardWidth} label="All photos" count={stats?.total ?? 0} icon={<Images size={20} color={colors.textMuted} />} onPress={() => onOpenPhotos({})} />
          <Card width={cardWidth} label="Favorites" count={stats?.favorites ?? 0} icon={<Heart size={20} color={colors.favorite} />} onPress={onOpenFavorites} />
          {CATEGORY_CARDS.map(({ id, label, Icon }) => (
            <Card key={id} width={cardWidth} label={label} count={stats?.categories[id] ?? 0} icon={<Icon size={20} color={colors.textMuted} />} onPress={() => onOpenPhotos({ category: id })} />
          ))}
        </View>

        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.heading}>Tags</Text>
        <SearchInput value={input} onChangeText={setInput} placeholder="Filter tags…" />
        <View style={styles.tags}>
          {visibleTags.length === 0 ? (
            <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.muted}>{stats?.tags.length ? 'No tags match.' : 'Tags you add to photos appear here.'}</Text>
          ) : (
            visibleTags.map((tag) => <Chip key={tag} label={`#${tag}`} onPress={() => onOpenPhotos({ tag })} />)
          )}
        </View>

        {cameras.length > 0 && (
          <>
            <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.heading}>Cameras</Text>
            <View style={styles.cameraBox}>
              {cameras.map(([name, count]) => (
                <View key={name} style={styles.cameraRow}>
                  <Camera size={14} color={colors.textMuted} />
                  <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.cameraName} numberOfLines={1}>{name}</Text>
                  <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.cameraCount}>{count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.heading}>Account</Text>
        <View style={styles.cameraBox}>
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.muted} numberOfLines={1}>{user?.email}</Text>
          <Button label="Sign out" variant="secondary" icon={<LogOut size={16} color={colors.textMuted} />} onPress={confirmSignOut} style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function Card({ width, label, count, icon, onPress }: { width: number; label: string; count: number; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${count} photos`} style={[styles.card, { width }]}>
      <View style={styles.cardHeader}>
        {icon}
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.count}>{count}</Text>
      </View>
      <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, alignSelf: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  cardLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  cameraBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14, gap: 8 },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cameraName: { flex: 1, fontSize: fontSize.sm, color: colors.textSoft },
  cameraCount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent },
});
