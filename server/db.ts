import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or DATABASE_PRIVATE_URL must be set. Did you forget to provision a database?",
  );
}

const isPrivateUrl = !!process.env.DATABASE_PRIVATE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: isPrivateUrl 
    ? false 
    : (isProduction ? { rejectUnauthorized: false } : false)
});
export const db = drizzle({ client: pool, schema });
