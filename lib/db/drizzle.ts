import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Sadece server-side'da dotenv yükle
if (typeof window === 'undefined') {
  dotenv.config();
}

// Veritabanı bağlantısını lazy olarak oluştur
let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getDbConnection() {
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  // Build sırasında veritabanı gerekmez
  if (!dbUrl && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
    throw new Error('Database URL is required for production. Please set POSTGRES_URL or DATABASE_URL environment variable.');
  }
  
  // Development için placeholder
  const connectionString = dbUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  
  if (!_client) {
    _client = postgres(connectionString);
  }
  
  if (!_db) {
    _db = drizzle(_client, { schema });
  }
  
  return { client: _client, db: _db };
}

// Export getter functions instead of direct connections
export function getClient() {
  return getDbConnection().client;
}

export function getDb() {
  return getDbConnection().db;
}

// Backward compatibility
export const client = new Proxy({} as postgres.Sql, {
  get(target, prop) {
    return getClient()[prop as keyof postgres.Sql];
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
