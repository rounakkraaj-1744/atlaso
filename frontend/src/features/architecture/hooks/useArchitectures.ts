import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Architecture } from '../../../lib/api';
import type { CanvasNode, Connection } from '../../../types';

export function useArchitectures(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['architectures', page, limit],
        queryFn: () => api.getArchitectures(page, limit),
    });
}

export function useArchitecture(id: string | null) {
    return useQuery({
        queryKey: ['architecture', id],
        queryFn: () => api.getArchitecture(id!),
        enabled: !!id,
    });
}

export function useCreateArchitecture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description: string;
            nodes: CanvasNode[];
            edges: Connection[];
        }) => api.createArchitecture(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['architectures'] });
        },
    });
}

export function useUpdateArchitecture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: Partial<{ name: string; description: string; nodes: CanvasNode[]; edges: Connection[] }>;
        }) => api.updateArchitecture(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['architectures'] });
            queryClient.invalidateQueries({ queryKey: ['architecture', id] });
        },
    });
}

export function useDeleteArchitecture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteArchitecture(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['architectures'] });
        },
    });
}

export function useForkArchitecture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: { id: string; name?: string }) => api.forkArchitecture(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['architectures'] });
        },
    });
}
