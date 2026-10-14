import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet, Button, TextField } from '@/components/ui';
import { albumSchema, firstError } from '@/utils/validation';
import { logError, toUserMessage } from '@/utils/errors';
import { haptics } from '@/utils/haptics';
import { useCreateAlbum } from '../hooks/useAlbums';

interface AlbumCreateSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AlbumCreateSheet({ visible, onClose }: AlbumCreateSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createAlbum = useCreateAlbum();

  const close = () => { setName(''); setDescription(''); setError(null); onClose(); };

  const submit = async () => {
    const parsed = albumSchema.safeParse({ name, description });
    if (!parsed.success) { setError(firstError(parsed.error)); return; }
    setError(null);
    try {
      await createAlbum.mutateAsync(parsed.data);
      haptics.success();
      close();
    } catch (e) {
      logError('createAlbum', e);
      setError(toUserMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} title="New album" onClose={close}>
      <TextField label="Name" value={name} onChangeText={setName} maxLength={60} placeholder="Kyoto 2026" autoFocus />
      <TextField label="Description (optional)" value={description} onChangeText={setDescription} maxLength={200} placeholder="Spring trip" error={error} />
      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={close} style={styles.flex} />
        <Button label="Create" onPress={submit} loading={createAlbum.isPending} style={styles.flex} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex: { flex: 1 },
});
