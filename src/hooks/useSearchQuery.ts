import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPlaces } from '../api/serpapi';

const NO_RETRY = /\b(401|403|429)\b|quota/i;

export function useSearchQuery(query: string, ll: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['search', query, ll],
    queryFn: ({ pageParam = 0 }) => fetchPlaces(query, ll, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length * 20 : undefined,
    enabled: enabled && !!query && !!ll,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, err) =>
      failureCount < 1 && !NO_RETRY.test(err?.message ?? ''),
  });
}