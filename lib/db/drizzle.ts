import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
console.log('Database URL:', dbUrl); // Debug için eklendi

if (!dbUrl) {
  throw new Error('Neither POSTGRES_URL nor DATABASE_URL environment variable is set');
}

export const client = postgres(dbUrl);
export const db = drizzle(client, { schema });
