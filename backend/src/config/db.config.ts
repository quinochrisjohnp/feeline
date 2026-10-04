import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// ============================================================
// DATABASE CONFIGURATION
// ============================================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not configured'
  );
}

// Prisma 7 PostgreSQL driver adapter
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

// Shared Prisma client instance used throughout the backend
const prisma = new PrismaClient({
  adapter,
});

export default prisma;