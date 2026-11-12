import { db, pool } from './client.js';
import { projects } from './schema.js';

const [owner] = await db.select().from((await import('./schema.js')).users).limit(1);
if (owner) {
  const [existing] = await db.select().from(projects).limit(1);
  if (!existing) 
    await db.insert(projects).values({ ownerId: owner.id, name: 'Atlaso Demo', description: 'Sample project for local development' });
  console.log('Development project seed complete.');
} else {
  console.log('Create an account through Better Auth, then run the seed command.');
}
await pool.end();
