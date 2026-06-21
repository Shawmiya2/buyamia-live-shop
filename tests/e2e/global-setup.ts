import { execFileSync, spawn } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

export default async function globalSetup() {
  const root = process.cwd();
  const testDb = path.join(root, "test.db");
  const resultsDir = path.join(root, "test-results");
  const port = 3106;
  const bin = (name: string) => path.join(root, "node_modules", ".bin", `${name}.cmd`);
  const run = (command: string, args: string[]) => {
    execFileSync("cmd.exe", ["/c", command, ...args], { cwd: root, env, stdio: "inherit" });
  };
  const env = {
    ...process.env,
    DATABASE_URL: "file:./test.db",
    SEED_ADMIN_EMAIL: "admin@example.test",
    SEED_ADMIN_PASSWORD: "ChangeMe123!",
  };

  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${testDb}${suffix}`;
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }

  run(bin("prisma"), ["generate"]);
  run(bin("prisma"), ["migrate", "deploy"]);
  run(bin("tsx"), ["prisma/seed.ts"]);
  mkdirSync(resultsDir, { recursive: true });

  const server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    },
  );

  server.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  writeFileSync(path.join(resultsDir, "e2e-server.json"), JSON.stringify({ pid: server.pid, port }));

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("Timed out waiting for the e2e Next.js server.");
}
