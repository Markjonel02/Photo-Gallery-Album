import { AuthError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Converts any thrown value into a safe, human-readable message.
 * Raw backend messages (which may leak schema details) are never shown.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof AuthError) {
    if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (/invalid login credentials/i.test(error.message)) return 'Invalid email or password.';
    if (/email not confirmed/i.test(error.message)) return 'Please confirm your email first.';
    return 'Authentication failed. Please try again.';
  }
  if (error instanceof Error && /network|fetch|timeout/i.test(error.message)) {
    return 'Network problem. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function logError(scope: string, error: unknown): void {
  if (__DEV__) console.warn(`[${scope}]`, error);
}
