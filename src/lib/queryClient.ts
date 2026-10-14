import { AppState } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

// Tell React Query when the app returns to the foreground.
AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});
