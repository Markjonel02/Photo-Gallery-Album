import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Modal sheet that respects safe areas, the keyboard and tablet widths. */
export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  const { insets, height, isTablet } = useResponsive();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            { maxHeight: height * 0.9, paddingBottom: Math.max(insets.bottom, 16) },
            isTablet && styles.sheetTablet,
          ]}
        >
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
  },
  sheetTablet: { alignSelf: 'center', width: 560, borderRadius: radius.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
});
