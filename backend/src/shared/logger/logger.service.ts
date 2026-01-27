/**
 * Logger Service - Custom logging abstraction
 */

import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
    private context?: string;

    /**
     * Set the logging context
     */
    setContext(context: string): this {
        this.context = context;
        return this;
    }

    /**
     * Log a message at the specified level
     */
    private formatMessage(level: LogLevel, message: string, meta?: object): string {
        const timestamp = new Date().toISOString();
        const ctx = this.context ? `[${this.context}]` : '';
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level.toUpperCase()} ${ctx} ${message}${metaStr}`;
    }

    /**
     * Log debug message
     */
    debug(message: string, meta?: object): void {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }

    /**
     * Log info message
     */
    log(message: string, meta?: object): void {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }

    /**
     * Log warning message
     */
    warn(message: string, meta?: object): void {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }

    /**
     * Log error message
     */
    error(message: string, trace?: string, meta?: object): void {
        console.error(this.formatMessage(LogLevel.ERROR, message, meta));
        if (trace) {
            console.error(trace);
        }
    }

    /**
     * Log verbose message (alias for debug)
     */
    verbose(message: string, meta?: object): void {
        this.debug(message, meta);
    }

    /**
     * Create a child logger with additional context
     */
    child(context: string): LoggerService {
        const child = new LoggerService();
        child.setContext(this.context ? `${this.context}:${context}` : context);
        return child;
    }
}
