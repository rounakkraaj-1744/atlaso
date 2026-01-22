export const ENV = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL || '',
} as const;
