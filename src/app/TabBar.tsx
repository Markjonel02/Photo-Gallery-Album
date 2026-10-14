import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Compass, FolderKanban, Heart, Images } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';
import type { TabId } from '@/types/navigation';
import { colors, fontSize, MAX_FONT_MULTIPLIER, TAB_BAR_HEIGHT } from '@/theme';

const TABS: { id: TabId; label: string; Icon: typeof Images }[] = [
  { id: 'photos', label: 'Photos', Icon: Images },
  { id: 'albums', label: 'Albums', Icon: FolderKanban },
  { id: 'explore', label: 'Explore', Icon: Compass },
  { id: 'favorites', label: 'Favorites', Icon: Heart },
];

interface TabBarProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
}

export function TabBar({ active, onSelect }: TabBarProps) {
  const { insets } = useResponsive();
  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={styles.item}
          >
            <Icon size={20} color={isActive ? colors.accent : colors.textFaint} fill={isActive && id === 'favorites' ? colors.favorite : 'transparent'} />
            <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#0B1120', borderTopWidth: 1, borderColor: colors.border },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_HEIGHT },
  label: { fontSize: 10, fontWeight: '600', color: colors.textFaint, marginTop: 4 },
  labelActive: { color: colors.accent, fontWeight: '700' },
});
