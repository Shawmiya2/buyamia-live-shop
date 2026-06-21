import { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";

export default async function globalTeardown() {
  const marker = path.join(process.cwd(), "test-results", "e2e-server.json");
  if (!existsSync(marker)) {
    return;
  }

  const { pid } = JSON.parse(readFileSync(marker, "utf8")) as { pid?: number };
  if (pid) {
    try {
      process.kill(pid);
    } catch {
      // The server may already be stopped.
    }
  }
  unlinkSync(marker);
}
