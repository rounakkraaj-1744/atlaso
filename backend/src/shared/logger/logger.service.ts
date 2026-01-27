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

    setContext(context: string): this {
        this.context = context;
        return this;
    }

    private formatMessage(level: LogLevel, message: string, meta?: object): string {
        const timestamp = new Date().toISOString();
        const ctx = this.context ? `[${this.context}]` : '';
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level.toUpperCase()} ${ctx} ${message}${metaStr}`;
    }

    debug(message: string, meta?: object): void {
        if (process.env.NODE_ENV !== 'production')
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }

    log(message: string, meta?: object): void {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }

    warn(message: string, meta?: object): void {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }

    error(message: string, trace?: string, meta?: object): void {
        console.error(this.formatMessage(LogLevel.ERROR, message, meta));
        if (trace) {
            console.error(trace);
        }
    }

    verbose(message: string, meta?: object): void {
        this.debug(message, meta);
    }

    child(context: string): LoggerService {
        const child = new LoggerService();
        child.setContext(this.context ? `${this.context}:${context}` : context);
        return child;
    }
}