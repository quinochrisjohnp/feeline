import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Driver adapter - kailangan na ngayon sa Prisma 7 para gumawa ng
// actual na connection papunta sa PostgreSQL database
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Isang shared Prisma client instance na gagamitin sa buong app,
// gamit yung adapter para malaman kung paano at saan mag-connect
const prisma = new PrismaClient({ adapter });

export default prisma;