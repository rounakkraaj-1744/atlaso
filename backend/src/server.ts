import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './infrastructure/database/client.js';

const server = app.listen(env.PORT, () => {
  console.log(`Atlaso API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
