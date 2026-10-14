import { z } from 'zod';

const envSchema = z.object({
  supabaseUrl: z
    .string()
    .url()
    .refine((v) => v.startsWith('https://'), 'Supabase URL must use https'),
  supabaseAnonKey: z.string().min(20),
});

const parsed = envSchema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

/** Validated environment, or `null` when the app has not been configured yet. */
export const env = parsed.success ? parsed.data : null;
export const isConfigured = env !== null;

export const APP_LIMITS = {
  searchDebounceMs: 350,
  searchMaxLength: 64,
  pageSize: 30,
  maxUploadEdgePx: 2048,
  uploadQuality: 0.85,
  maxUploadBytes: 10 * 1024 * 1024,
  signedUrlTtlSeconds: 60 * 60,
} as const;
