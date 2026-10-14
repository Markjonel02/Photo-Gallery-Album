import { File } from 'expo-file-system';
import { AppError } from './errors';

/**
 * Upload hardening. Order of defence:
 *   1. allow-list by real file signature (magic bytes) — never the name / MIME the client claims
 *   2. size + pixel-count caps before decoding (decompression-bomb guard)
 *   3. decode + re-encode to JPEG (done in storageService) and re-verify the output
 */

export type ImageKind = 'jpeg' | 'png' | 'webp';

export const IMAGE_LIMITS = {
  /** Raw file read from the library, before re-encoding. */
  maxInputBytes: 40 * 1024 * 1024,
  /** Decoded pixels (width × height). 100 MP covers every phone sensor. */
  maxInputPixels: 100_000_000,
  maxOutputBytes: 10 * 1024 * 1024,
} as const;

const REJECT_MESSAGE = 'Unsupported file. Please choose a JPEG, PNG or WebP image.';

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  sig.every((b, i) => bytes[offset + i] === b);

/** Identifies an image by its leading bytes; returns null for anything else (SVG, HTML, PDF, ZIP, EXE…). */
export function detectImageKind(header: Uint8Array): ImageKind | null {
  if (header.length >= 3 && startsWith(header, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (header.length >= 8 && startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (
    header.length >= 12 &&
    startsWith(header, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    startsWith(header, [0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  ) {
    return 'webp';
  }
  return null;
}

/** Reads only the first bytes of a local file (no full load into memory). */
export function readHeader(uri: string, length = 16): Uint8Array {
  const handle = new File(uri).open();
  try {
    return handle.readBytes(length);
  } finally {
    handle.close();
  }
}

/** Throws a user-safe AppError unless the file is a real JPEG/PNG/WebP within limits. */
export function assertSafeImage(uri: string, dimensions?: { width?: number; height?: number }): ImageKind {
  let size: number;
  let kind: ImageKind | null;
  try {
    size = new File(uri).size ?? 0;
    kind = detectImageKind(readHeader(uri));
  } catch {
    throw new AppError('Could not read that file.');
  }

  if (!kind) throw new AppError(REJECT_MESSAGE);
  if (size <= 0) throw new AppError('That file is empty.');
  if (size > IMAGE_LIMITS.maxInputBytes) throw new AppError('That image is too large (max 40 MB).');

  const pixels = (dimensions?.width ?? 0) * (dimensions?.height ?? 0);
  if (pixels > IMAGE_LIMITS.maxInputPixels) throw new AppError('That image has too many pixels (max 100 MP).');

  return kind;
}

/** After re-encoding, the output must be a JPEG within the output size cap. */
export function assertEncodedJpeg(uri: string): number {
  const file = new File(uri);
  const size = file.size ?? 0;
  if (detectImageKind(readHeader(uri)) !== 'jpeg') {
    throw new AppError('The image could not be processed safely.');
  }
  if (size <= 0 || size > IMAGE_LIMITS.maxOutputBytes) {
    throw new AppError('This image is too large after processing (max 10 MB).');
  }
  return size;
}
