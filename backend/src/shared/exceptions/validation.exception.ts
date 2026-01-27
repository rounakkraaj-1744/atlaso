import { HttpException, HttpStatus } from '@nestjs/common';

export interface ValidationError {
    field: string;
    message: string;
    value?: unknown;
}

export class ValidationException extends HttpException {
    constructor(public readonly errors: ValidationError[]) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors,
                timestamp: new Date().toISOString(),
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    static fromField(field: string, message: string, value?: unknown): ValidationException {
        return new ValidationException([{ field, message, value }]);
    }

    static fromFields(errors: Record<string, string>): ValidationException {
        return new ValidationException(
            Object.entries(errors).map(([field, message]) => ({ field, message })),
        );
    }
}

export class SchemaValidationException extends ValidationException {
    constructor(errors: ValidationError[]) {
        super(errors);
    }

    static nodeError(nodeId: string, message: string): SchemaValidationException {
        return new SchemaValidationException([
            { field: `nodes.${nodeId}`, message },
        ]);
    }

    static edgeError(edgeId: string, message: string): SchemaValidationException {
        return new SchemaValidationException([
            { field: `edges.${edgeId}`, message },
        ]);
    }
}