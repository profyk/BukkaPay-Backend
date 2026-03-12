import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.EXTERNAL_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("EXTERNAL_DATABASE_URL must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
