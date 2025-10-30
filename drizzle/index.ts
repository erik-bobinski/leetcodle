import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

// Disable prefetch for Supabase compatibility
// (can't do prefetch/caching b/w queries in "Transaction" mode)
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client);
