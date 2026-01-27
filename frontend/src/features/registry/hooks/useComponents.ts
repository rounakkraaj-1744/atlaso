import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useComponents(category?: string) {
    return useQuery({
        queryKey: ['components', category],
        queryFn: () => api.getComponents(category),
        staleTime: 1000 * 60 * 10, // 10 minutes - components rarely change
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.getCategories(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
