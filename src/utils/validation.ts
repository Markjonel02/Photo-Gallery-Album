import { z } from 'zod';
import { PHOTO_CATEGORIES } from '@/types/photo';

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Enter your password').max(128),
});

export const signUpSchema = signInSchema.extend({
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128)
    .regex(/[a-z]/i, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});

export const albumSchema = z.object({
  name: z.string().trim().min(1, 'Give the album a name').max(60, 'Max 60 characters'),
  description: z.string().trim().max(200, 'Max 200 characters').default(''),
});

export const photoDetailsSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(80, 'Max 80 characters'),
  location: z.string().trim().max(80, 'Max 80 characters').optional(),
  category: z.enum(PHOTO_CATEGORIES),
});

/** "Sunset, Beach  ,, #Golden" → ['sunset', 'beach', 'golden'] (max 10, 24 chars each). */
export function parseTags(raw: string): string[] {
  const cleaned = raw
    .split(',')
    .map((t) => t.normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().toLowerCase())
    .filter((t) => t.length > 0)
    .map((t) => t.slice(0, 24));
  return Array.from(new Set(cleaned)).slice(0, 10);
}

/** Returns the first validation message of a zod error, or null. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}
