import React from 'react';
import { Image, type ImageProps } from 'expo-image';
import { colors } from '@/theme';

interface RemoteImageProps extends Omit<ImageProps, 'source'> {
  url: string | null;
  /** Stable identity (storage path). Signed URLs rotate, the disk cache must not. */
  cacheKey: string | null;
}

export function RemoteImage({ url, cacheKey, style, ...rest }: RemoteImageProps) {
  return (
    <Image
      source={url ? { uri: url, cacheKey: cacheKey ?? undefined } : undefined}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={cacheKey ?? undefined}
      style={[{ backgroundColor: colors.surface }, style]}
      {...rest}
    />
  );
}
