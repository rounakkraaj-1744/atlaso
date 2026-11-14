import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { CanvasNode, Connection } from '../../../types';
import type { CanvasDocument } from '../../../lib/api';

export function useArchitectures(page = 1, limit = 20, projectId?: string) {
    return useQuery({
        queryKey: ['architectures', projectId, page, limit],
        queryFn: () => api.getArchitectures(page, limit, projectId),
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
            canvasMetadata?: Record<string, unknown>;
            providerProfile?: string;
            projectId?: string;
            type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT';
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
            data: Partial<{ name: string; description: string; nodes: CanvasNode[]; edges: Connection[]; canvasMetadata: Record<string, unknown>; providerProfile: string; expectedVersion: number }>;
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

export function useProjects() {
    return useQuery({ queryKey: ['projects'], queryFn: () => api.getProjects() });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string }) => api.createProject(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useSaveCanvas() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, document, expectedRevision, metadata }: {
            id: string;
            document: CanvasDocument;
            expectedRevision: number;
            metadata?: { name?: string; description?: string; type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT' };
        }) => api.saveCanvas(id, document, expectedRevision, metadata),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['architectures'] });
            queryClient.invalidateQueries({ queryKey: ['architecture', id] });
        },
    });
}
