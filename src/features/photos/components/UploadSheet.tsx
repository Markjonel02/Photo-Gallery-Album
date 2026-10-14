import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Check, Upload } from 'lucide-react-native';
import { BottomSheet, Button, Chip, RemoteImage, TextField } from '@/components/ui';
import { Pressable } from 'react-native';
import { useAlbums } from '@/features/albums/hooks/useAlbums';
import { useCreatePhoto } from '../hooks/usePhotos';
import { extractMetadata } from '../utils/exif';
import { PHOTO_CATEGORIES, type PhotoCategory } from '@/types/photo';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { firstError, parseTags, photoDetailsSchema } from '@/utils/validation';
import { logError, toUserMessage } from '@/utils/errors';
import { haptics } from '@/utils/haptics';
import { assertSafeImage } from '@/utils/imageSecurity';

interface UploadSheetProps {
  visible: boolean;
  onClose: () => void;
  defaultAlbumId?: string | null;
}

export function UploadSheet({ visible, onClose, defaultAlbumId = null }: UploadSheetProps) {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('minimal');
  const [albumId, setAlbumId] = useState<string | null>(defaultAlbumId);
  const [error, setError] = useState<string | null>(null);

  const { data: albums = [] } = useAlbums();
  const createPhoto = useCreatePhoto();

  const reset = () => {
    setAsset(null); setTitle(''); setLocation(''); setTagsText('');
    setCategory('minimal'); setAlbumId(defaultAlbumId); setError(null);
  };
  const close = () => { reset(); onClose(); };

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access in Settings to import photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    try {
      // Fail fast, before the user fills in the form. Checks real bytes, not the file name.
      assertSafeImage(picked.uri, picked);
    } catch (e) {
      setError(toUserMessage(e));
      return;
    }
    setError(null);
    setAsset(picked);
    if (!title) setTitle((picked.fileName ?? '').replace(/\.[^.]+$/, '').slice(0, 80));
  };

  const save = async () => {
    if (!asset) return;
    const parsed = photoDetailsSchema.safeParse({ title, location: location || undefined, category });
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }
    setError(null);
    const { takenAt, metadata } = extractMetadata(asset);
    try {
      await createPhoto.mutateAsync({
        localUri: asset.uri,
        dimensions: { width: asset.width, height: asset.height },
        title: parsed.data.title,
        category: parsed.data.category,
        tags: parseTags(tagsText),
        location: parsed.data.location || null,
        albumId,
        takenAt,
        metadata,
      });
      haptics.success();
      close();
    } catch (e) {
      logError('upload', e);
      setError(toUserMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} title="Add photo" onClose={close}>
      {!asset ? (
        <>
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <Pressable onPress={pick} style={styles.dropzone} accessibilityRole="button" accessibilityLabel="Choose a photo from your library">
          <Upload size={32} color={colors.primaryText} />
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.dropTitle}>Choose from library</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.dropSub}>JPEG, PNG or WebP. Photos are re-encoded and stored privately in your account.</Text>
        </Pressable>
        </>
      ) : (
        <View>
          <Pressable onPress={pick} accessibilityLabel="Choose a different photo">
            <RemoteImage url={asset.uri} cacheKey={null} style={styles.preview} />
          </Pressable>

          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={80} placeholder="Photo title" />
          <TextField label="Location (optional)" value={location} onChangeText={setLocation} maxLength={80} placeholder="Kyoto, Japan" />
          <TextField label="Tags (comma separated)" value={tagsText} onChangeText={setTagsText} autoCapitalize="none" placeholder="sunset, beach" />

          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.label}>Category</Text>
          <View style={styles.wrap}>
            {PHOTO_CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          {albums.length > 0 && (
            <>
              <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.label}>Album</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumRow}>
                <Chip label="None" selected={albumId === null} onPress={() => setAlbumId(null)} />
                {albums.map((a) => (
                  <Chip key={a.id} label={a.name} selected={albumId === a.id} onPress={() => setAlbumId(a.id)} />
                ))}
              </ScrollView>
            </>
          )}

          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}

          <Button
            label="Save to library"
            icon={<Check size={18} color={colors.white} />}
            onPress={save}
            loading={createPhoto.isPending}
            style={{ marginTop: 8 }}
          />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  dropzone: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.lg, padding: 28, alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.08)' },
  dropTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryText, marginTop: 10 },
  dropSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  preview: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  albumRow: { gap: 6, paddingBottom: 12 },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: 8 },
});
