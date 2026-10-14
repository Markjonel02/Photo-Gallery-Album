import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { haptics } from '@/utils/haptics';

interface ReorderableListProps<T extends { id: string }> {
  data: T[];
  renderItem: (item: T, drag: () => void, isActive: boolean) => React.ReactElement;
  onReorder: (items: T[]) => void;
  contentPaddingBottom: number;
}

/**
 * Drag-to-reorder list. Keeps its own copy of the order so the row drops where
 * the user released it immediately, while the server write happens in the background.
 */
export function ReorderableList<T extends { id: string }>({
  data,
  renderItem,
  onReorder,
  contentPaddingBottom,
}: ReorderableListProps<T>) {
  const [items, setItems] = useState(data);
  useEffect(() => setItems(data), [data]);

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      onDragBegin={haptics.medium}
      onDragEnd={({ data: next }) => {
        setItems(next);
        onReorder(next);
        haptics.light();
      }}
      renderItem={({ item, drag, isActive }: RenderItemParams<T>) => (
        <ScaleDecorator>{renderItem(item, drag, isActive)}</ScaleDecorator>
      )}
      contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
    />
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 14 } });
