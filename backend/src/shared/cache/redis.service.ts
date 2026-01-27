/**
 * Redis Service - Caching abstraction layer
 * Note: This is a placeholder for future Redis implementation
 * Currently uses in-memory Map as a simple cache
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { redisConfig } from '../../config/redis.config';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private cache = new Map<string, { value: string; expiresAt: number }>();
    private readonly prefix = redisConfig.keyPrefix;

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        const prefixedKey = this.prefix + key;
        const entry = this.cache.get(prefixedKey);

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(prefixedKey);
            return null;
        }

        return JSON.parse(entry.value) as T;
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const prefixedKey = this.prefix + key;
        const ttl = ttlSeconds || redisConfig.ttl.medium;
        const expiresAt = Date.now() + (ttl * 1000);

        this.cache.set(prefixedKey, {
            value: JSON.stringify(value),
            expiresAt,
        });
    }

    /**
     * Delete a value from cache
     */
    async del(key: string): Promise<void> {
        const prefixedKey = this.prefix + key;
        this.cache.delete(prefixedKey);
    }

    /**
     * Delete all keys matching a pattern
     */
    async delPattern(pattern: string): Promise<void> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => this.cache.delete(key));
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== null;
    }

    /**
     * Get or set with factory function
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds?: number,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;

        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        this.cache.clear();
    }

    /**
     * Cleanup on module destroy
     */
    onModuleDestroy() {
        this.cache.clear();
    }
}
