
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

if (!process.env.TURSO_CONNECTION_URL) {
  throw new Error(
    'TURSO_CONNECTION_URL must be set. Did you forget to provision a database?'
  );
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    'TURSO_AUTH_TOKEN must be set. Did you forget to provision a database?'
  );
}

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;