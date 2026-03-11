import { createClient } from "@libsql/client";
import { env } from "@open-basket/env/server";
import { drizzle } from "drizzle-orm/libsql";

export * from "./schema/index.js";

const client = createClient({
  url: env.DATABASE_URL,
});

export const db = drizzle({ client });
