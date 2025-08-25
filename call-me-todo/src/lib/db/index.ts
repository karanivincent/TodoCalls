import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// During build, we don't need a real database connection
let db: ReturnType<typeof drizzle<typeof schema>>;

if (!building) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  
  // Create the connection
  const client = postgres(env.DATABASE_URL);
  db = drizzle(client, { schema });
} else {
  // Dummy db for build time
  db = {} as any;
}

export { db };

// Export schema for easy access
export * from './schema';