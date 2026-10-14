import type { ImagePickerAsset } from 'expo-image-picker';
import type { NewPhotoInput } from '@/types/photo';

type Exif = Record<string, unknown>;

const str = (v: unknown, max = 80): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const num = (v: unknown): number | null => {
  const n = Array.isArray(v) ? Number(v[0]) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** "2026:04:14 07:12:00" → ISO string (falls back to now). */
function parseExifDate(v: unknown): string {
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return new Date().toISOString();
}

/**
 * Pulls display-safe camera details from the picker EXIF.
 * GPS coordinates are deliberately ignored — they never leave the device.
 */
export function extractMetadata(asset: ImagePickerAsset): Pick<NewPhotoInput, 'takenAt' | 'metadata'> {
  const exif = (asset.exif ?? {}) as Exif;
  const make = str(exif.Make, 40);
  const model = str(exif.Model, 40);
  const focal = num(exif.FocalLength);
  const fNumber = num(exif.FNumber);
  const exposure = num(exif.ExposureTime);

  return {
    takenAt: parseExifDate(exif.DateTimeOriginal ?? exif.DateTime),
    metadata: {
      camera: [make, model].filter(Boolean).join(' ') || null,
      lens: str(exif.LensModel),
      focalLength: focal ? `${Math.round(focal)}mm` : null,
      aperture: fNumber ? `ƒ/${fNumber}` : null,
      iso: num(exif.ISOSpeedRatings ?? exif.ISO),
      shutterSpeed: exposure ? (exposure >= 1 ? `${exposure}s` : `1/${Math.round(1 / exposure)}s`) : null,
    },
  };
}
