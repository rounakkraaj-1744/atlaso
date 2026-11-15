import 'dotenv/config';
import type { AddressInfo } from 'node:net';

const TEST_DATABASE_CONFIRMATION = 'I_CONFIRM_THIS_IS_AN_ISOLATED_TEST_DATABASE';
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export const databaseIntegrationTestsEnabled =
  process.env.NODE_ENV === 'test' &&
  Boolean(testDatabaseUrl) &&
  testDatabaseUrl !== process.env.DATABASE_URL &&
  process.env.ATLASO_TEST_DATABASE_CONFIRMATION === TEST_DATABASE_CONFIRMATION;

export interface TestUser {
  id: string;
  name: string;
  email: string;
  cookie: string;
}

export interface TestContext {
  baseUrl: string;
  request<T = Record<string, unknown>>(path: string, user?: TestUser, init?: RequestInit): Promise<{ status: number; body: T }>;
  createUser(label: string): Promise<TestUser>;
  dispose(): Promise<void>;
}

let contextPromise: Promise<TestContext> | undefined;

export function createTestContext(): Promise<TestContext> {
  if (!databaseIntegrationTestsEnabled || !testDatabaseUrl) {
    throw new Error('Set NODE_ENV=test, a separate TEST_DATABASE_URL, and the explicit isolated-test confirmation before running database integration specs.');
  }
  contextPromise ??= startTestContext(testDatabaseUrl);
  return contextPromise;
}

async function startTestContext(databaseUrl: string): Promise<TestContext> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;

  const [{ app }, { db, pool }, { migrate }, schema, drizzleOps] = await Promise.all([
    import('../app.js'),
    import('../infrastructure/database/client.js'),
    import('drizzle-orm/node-postgres/migrator'),
    import('../infrastructure/database/schema.js'),
    import('drizzle-orm'),
  ]);

  await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const userIds = new Set<string>();

  const request = async <T = Record<string, unknown>>(path: string, user?: TestUser, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (user) headers.set('Cookie', user.cookie);
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const body = response.status === 204 ? undefined : await response.json() as T;
    return { status: response.status, body: body as T };
  };

  return {
    baseUrl,
    request,
    async createUser(label: string) {
      const email = `atlaso-${label}-${crypto.randomUUID()}@example.test`;
      const signupResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' },
        body: JSON.stringify({ name: `Atlaso ${label}`, email, password: 'Integration-Test-Password-1!' }),
      });
      const signup = await signupResponse.json() as { user?: { id: string; name: string; email: string }; message?: string };
      if (signupResponse.status < 200 || signupResponse.status >= 300 || !signup.user) {
        throw new Error(`Better Auth test signup failed with HTTP ${signupResponse.status}.`);
      }
      userIds.add(signup.user.id);
      const cookie = signupResponse.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ');
      if (!cookie) throw new Error('Better Auth did not issue a session cookie for the integration user.');
      return { ...signup.user, cookie };
    },
    async dispose() {
      try {
        for (const userId of userIds) {
          await db.delete(schema.users).where(drizzleOps.eq(schema.users.id, userId));
        }
      } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        await pool.end();
      }
    },
  };
}
