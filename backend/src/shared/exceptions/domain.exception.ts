import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
    constructor(
        message: string,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
        public readonly code?: string,
    ) {
        super(
            {
                statusCode,
                message,
                code,
                timestamp: new Date().toISOString(),
            },
            statusCode,
        );
    }
}

export class ResourceNotFoundException extends DomainException {
    constructor(resource: string, id: string) {
        super(
            `${resource} with ID ${id} not found`,
            HttpStatus.NOT_FOUND,
            'RESOURCE_NOT_FOUND',
        );
    }
}

export class ResourceExistsException extends DomainException {
    constructor(resource: string, identifier: string) {
        super(
            `${resource} with identifier ${identifier} already exists`,
            HttpStatus.CONFLICT,
            'RESOURCE_EXISTS',
        );
    }
}

export class InvalidOperationException extends DomainException {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST, 'INVALID_OPERATION');
    }
}

export class AnalysisFailedException extends DomainException {
    constructor(message: string) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'ANALYSIS_FAILED');
    }
}