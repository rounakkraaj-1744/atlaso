export const ENV = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
} as const;

