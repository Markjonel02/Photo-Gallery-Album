import { APP_LIMITS } from '@/config/env';

/**
 * Normalises user search input before it reaches a query.
 * Allow-list only letters, digits, spaces and hyphens: this strips SQL LIKE
 * wildcards (% _), PostgREST filter syntax (, ( ) .) and control characters.
 */
export function sanitizeSearchTerm(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, APP_LIMITS.searchMaxLength)
    .toLowerCase();
}
