import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables from .env file
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  schemaFilter: "public",
  tablesFilter: "*",
  introspect: {
    casing: "preserve"
  },
  casing: "snake_case",
  strict: true,
  verbose: true
});
