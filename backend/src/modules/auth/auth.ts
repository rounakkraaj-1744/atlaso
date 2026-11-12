import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '../../infrastructure/database/client.js';
import * as schema from '../../infrastructure/database/schema.js';
import { env } from '../../config/env.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  trustedOrigins: [env.FRONTEND_ORIGIN],
});
