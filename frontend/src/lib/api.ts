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
    canvasMetadata?: Record<string, unknown>;
    providerProfile?: string;
    projectId?: string;
    version: number;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT';
    revision?: number;
    document?: CanvasDocument;
}

export interface CanvasDocument {
    nodes: CanvasNode[];
    connections: Connection[];
    viewport?: { x: number; y: number; zoom: number };
    [key: string]: unknown;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface CanvasResponse {
    architectureId: string;
    document: CanvasDocument;
    revision: number;
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

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

export interface AuthSession {
    user: AuthUser;
    session: { id: string; expiresAt: string };
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
                credentials: 'include',
            });

            if (!response.ok) {
                const error: { message?: string; error?: string } = await response.json().catch(() => ({ message: 'Request failed' }));
                console.error(`[API] Error ${response.status}:`, error);
                throw new Error(error.message || error.error || `HTTP ${response.status}`);
            }

            if (response.status === 204) return undefined as T;
            return await response.json() as T;
        } catch (err) {
            console.error(`[API] Request failed:`, err);
            throw err;
        }
    }

    async health(): Promise<{ status: string; database: string }> {
        return this.request('/health');
    }

    async getArchitectures(page = 1, limit = 20, projectId?: string): Promise<PaginatedResponse<Architecture>> {
        const path = projectId ? `/v1/projects/${projectId}/architectures` : '/architecture';
        return this.request(`${path}?page=${page}&limit=${limit}`);
    }

    async getArchitecture(id: string): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}`);
    }

    async createArchitecture(data: {
        name: string;
        description: string;
        nodes: CanvasNode[];
        edges: Connection[];
        canvasMetadata?: Record<string, unknown>;
        providerProfile?: string;
        projectId?: string;
        type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT';
    }): Promise<ApiResponse<Architecture>> {
        const { projectId, ...body } = data;
        if (projectId) return this.request(`/v1/projects/${projectId}/architectures`, { method: 'POST', body: JSON.stringify(body) });
        return this.request('/architecture', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async updateArchitecture(id: string, data: Partial<{
        name: string;
        description: string;
        nodes: CanvasNode[];
        edges: Connection[];
        canvasMetadata: Record<string, unknown>;
        providerProfile: string;
        expectedVersion: number;
    }>): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteArchitecture(id: string): Promise<ApiResponse<null>> {
        return this.request(`/architecture/${id}`, { method: 'DELETE' });
    }

    async applyProviderMapping(id: string, provider: string, mode: 'replace-all' | 'keep-manual', nodes?: CanvasNode[], edges?: Connection[], canvasMetadata?: Record<string, unknown>): Promise<ApiResponse<Architecture>> {
        return this.request(`/architecture/${id}/provider-mapping`, { method: 'POST', body: JSON.stringify({ provider, mode, nodes, edges, canvasMetadata }) });
    }

    async signUp(email: string, password: string, name: string): Promise<AuthSession> {
        return this.request('/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    }

    async signIn(email: string, password: string): Promise<AuthSession> {
        return this.request('/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email, password }) });
    }

    async currentUser(): Promise<AuthSession | null> {
        return this.request('/auth/get-session');
    }

    async signOut(): Promise<void> {
        return this.request('/auth/sign-out', { method: 'POST' });
    }

    async getProjects(): Promise<ApiResponse<Project[]>> {
        return this.request('/v1/projects');
    }

    async createProject(data: { name: string; description?: string }): Promise<ApiResponse<Project>> {
        return this.request('/v1/projects', { method: 'POST', body: JSON.stringify(data) });
    }

    async getProject(id: string): Promise<ApiResponse<Project & { architectures: Architecture[] }>> {
        return this.request(`/v1/projects/${id}`);
    }

    async updateProject(id: string, data: Partial<Pick<Project, 'name' | 'description'>>): Promise<ApiResponse<Project>> {
        return this.request(`/v1/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async deleteProject(id: string): Promise<ApiResponse<null>> {
        return this.request(`/v1/projects/${id}`, { method: 'DELETE' });
    }

    async getCanvas(id: string): Promise<ApiResponse<CanvasResponse>> {
        return this.request(`/v1/architectures/${id}/canvas`);
    }

    async saveCanvas(id: string, document: CanvasDocument, expectedRevision: number, metadata?: { name?: string; description?: string; type?: 'HLD' | 'LLD' | 'DATABASE' | 'DEPLOYMENT' }): Promise<ApiResponse<CanvasResponse>> {
        return this.request(`/v1/architectures/${id}/canvas`, { method: 'PUT', body: JSON.stringify({ document, expectedRevision, ...metadata }) });
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
