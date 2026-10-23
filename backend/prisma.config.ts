
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

// Client generation only needs the schema, not database credentials.
// Database commands still require a URL; runtime enforces it in db.config.ts.

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
