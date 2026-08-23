import { QueryClient } from "@tanstack/react-query";

/**
 * Global TanStack Query Client Configuration
 * Optimized for snappy UI, caching visited views, and background fetching without UI destruction
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh data
      gcTime: 30 * 60 * 1000, // 30 minutes in memory cache
      refetchOnWindowFocus: false, // Prevent jarring refetches on window focus
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
