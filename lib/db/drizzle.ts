import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Sadece server-side'da dotenv yükle
if (typeof window === 'undefined') {
  dotenv.config();
}

// Database bağlantısı
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('Database URL is required. Please set POSTGRES_URL or DATABASE_URL environment variable.');
}

const client = postgres(dbUrl);
export const db = drizzle(client, { schema });

// Client export for direct access
export { client };
