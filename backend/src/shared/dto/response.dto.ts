/**
 * Common Response DTOs
 */

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
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

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
}

export function createErrorResponse(error: string): ApiResponse<null> {
    return {
        success: false,
        error,
        timestamp: new Date().toISOString(),
    };
}

export function createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): PaginatedResponse<T> {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    };
}
