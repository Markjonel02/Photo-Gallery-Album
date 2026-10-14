import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { APP_LIMITS } from '@/config/env';
import { AppError } from '@/utils/errors';
import { assertEncodedJpeg, assertSafeImage } from '@/utils/imageSecurity';

const BUCKET = 'photos';

export interface UploadedImage {
  path: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/** In-memory cache so lists don't re-sign the same objects on every refetch. */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const EXPIRY_SAFETY_MS = 60_000;

export const storageService = {
  /**
   * Validates the real file signature, decodes, resizes and re-encodes as JPEG
   * (dropping all original metadata and any appended/embedded payload), verifies
   * the output, then uploads under `<userId>/`.
   */
  async uploadImage(
    userId: string,
    localUri: string,
    dimensions?: { width?: number; height?: number },
  ): Promise<UploadedImage> {
    assertSafeImage(localUri, dimensions); // 1 + 2: allow-list by magic bytes, size/pixel caps

    let result: { uri: string; width: number; height: number };
    try {
      // 3: a trusted native decoder must be able to fully decode it, then we re-encode.
      const image = await ImageManipulator.manipulate(localUri)
        .resize({ width: APP_LIMITS.maxUploadEdgePx })
        .renderAsync();
      result = await image.saveAsync({ format: SaveFormat.JPEG, compress: APP_LIMITS.uploadQuality });
    } catch {
      throw new AppError('That file is not a valid image.');
    }

    const sizeBytes = assertEncodedJpeg(result.uri); // re-verify what we are about to send
    const file = new File(result.uri);

    const path = `${userId}/${Crypto.randomUUID()}.jpg`;
    const bytes = await file.bytes();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;

    return { path, width: result.width, height: result.height, sizeBytes };
  },

  /** Returns a map of storage path → short-lived signed URL (batched + cached). */
  async getSignedUrls(paths: string[]): Promise<Record<string, string>> {
    const now = Date.now();
    const out: Record<string, string> = {};
    const missing: string[] = [];

    for (const path of Array.from(new Set(paths))) {
      const cached = signedUrlCache.get(path);
      if (cached && cached.expiresAt - EXPIRY_SAFETY_MS > now) out[path] = cached.url;
      else missing.push(path);
    }

    if (missing.length > 0) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(missing, APP_LIMITS.signedUrlTtlSeconds);
      if (error) throw error;
      const expiresAt = now + APP_LIMITS.signedUrlTtlSeconds * 1000;
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) {
          signedUrlCache.set(item.path, { url: item.signedUrl, expiresAt });
          out[item.path] = item.signedUrl;
        }
      }
    }
    return out;
  },

  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw error;
    paths.forEach((p) => signedUrlCache.delete(p));
  },

  clearCache(): void {
    signedUrlCache.clear();
  },
};
