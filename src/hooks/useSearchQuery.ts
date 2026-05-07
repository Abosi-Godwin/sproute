import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPlaces } from '../api/serpapi';

export function useSearchQuery(query: string, ll: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['search', query, ll],
    queryFn: ({ pageParam = 0 }) => fetchPlaces(query, ll, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length * 20 : undefined,
    enabled: enabled && !!query && !!ll,
    staleTime: 1000 * 60 * 5,
  });
}