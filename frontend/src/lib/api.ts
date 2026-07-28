import { ENV } from '../config/environment';
import type { CanvasNode, Connection, SystemConstraints, AnalysisResult, Suggestion, ComponentDefinition } from '../types';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface Architecture {
    id: string;
    name: string;
    description: string;
    nodes: CanvasNode[];
    edges: Connection[];
    version: number;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ScenarioPreset {
    type: string;
    name: string;
    description: string;
    constraints: SystemConstraints;
}

export interface EvaluationOutput {
    analysis: AnalysisResult;
    suggestions: Suggestion[];
    maxThroughputRps: number;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = ENV.apiUrl;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`[API] ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                console.error(`[API] Error ${response.status}:`, error);
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`[API] Response:`, data);
            return data;
        } catch (err) {
            console.error(`[API] Request failed:`, err);
            throw err;
        }
    }

    async health(): Promise<{ status: string; database: string }> {
        return this.request('/health');
    }

    async getArchitectures(page = 1, limit = 20): Promise<PaginatedResponse<Architecture>> {
        return this.request(`/architecture?page=${page}&limit=${limit}`);
    }

    async getArchitecture(id: string): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}`);
    }

    async createArchitecture(data: {
        name: string;
        description: string;
        nodes: CanvasNode[];
        edges: Connection[];
    }): Promise<ApiResponse<Architecture>> {
        return this.request('/architecture', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateArchitecture(id: string, data: Partial<{
        name: string;
        description: string;
        nodes: CanvasNode[];
        edges: Connection[];
    }>): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteArchitecture(id: string): Promise<ApiResponse<null>> {
        return this.request(`/architecture/${id}`, { method: 'DELETE' });
    }

    async forkArchitecture(id: string, name?: string): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}/fork`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async getComponents(category?: string): Promise<PaginatedResponse<ComponentDefinition>> {
        const params = category ? `?category=${category}` : '';
        return this.request(`/registry/components${params}`);
    }

    async getCategories(): Promise<ApiResponse<{ key: string; name: string }[]>> {
        return this.request('/registry/categories');
    }

    async getScenarioPresets(): Promise<ApiResponse<ScenarioPreset[]>> {
        return this.request('/scenarios/presets');
    }

    async analyzeInline(data: {
        nodes: CanvasNode[];
        edges: Connection[];
        constraints: SystemConstraints;
    }): Promise<ApiResponse<EvaluationOutput>> {
        return this.request('/evaluations/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async runEvaluation(architectureId: string, scenarioId: string): Promise<ApiResponse<{
        evaluationRun: unknown;
        output: EvaluationOutput;
    }>> {
        return this.request('/evaluations/run', {
            method: 'POST',
            body: JSON.stringify({ architectureId, scenarioId }),
        });
    }

    async compareArchitectures(baseId: string, modifiedId: string): Promise<ApiResponse<{
        id: string;
        diff: Record<string, string[]>;
        metrics: Record<string, number | string>;
    }>> {
        return this.request('/comparisons', {
            method: 'POST',
            body: JSON.stringify({ baseId, modifiedId }),
        });
    }
}

export const api = new ApiClient();
