import "dotenv/config";
import { existsSync, unlinkSync } from "fs";
import path from "path";

if (process.env.BACKEND_RESET_CONFIRM !== "RESET_LOCAL_DATABASE") {
  console.error("Refusing to reset. Re-run with BACKEND_RESET_CONFIRM=RESET_LOCAL_DATABASE.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
if (!databaseUrl.startsWith("file:")) {
  console.error("backend:reset only supports local SQLite file databases.");
  process.exit(1);
}

const dbPath = path.resolve("prisma", databaseUrl.replace("file:", ""));
for (const target of [dbPath, `${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (existsSync(target)) {
    unlinkSync(target);
  }
}

console.warn("Local development database removed. Run npm run backend:setup to recreate it.");
