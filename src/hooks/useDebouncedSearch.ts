import { useMemo, useState } from 'react';
import { sanitizeSearchTerm } from '@/utils/search';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Standard search state used by every search box in the app:
 *  - `input`    → bind to the TextInput (updates instantly)
 *  - `term`     → debounced + sanitised value that is safe to put in a query key
 *  - `isTyping` → true while the debounce window is still open
 */
export function useDebouncedSearch(delayMs?: number) {
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input, delayMs);
  const term = useMemo(() => sanitizeSearchTerm(debounced), [debounced]);
  const isTyping = input !== debounced;
  return { input, setInput, term, isTyping };
}
