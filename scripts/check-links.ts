import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const appDir = path.join(process.cwd(), "app");
const allowedDynamicPrefixes = ["/live/"];
const compatibilityRoutes: Record<string, string> = {
  "/hotel-dashboard": "/dashboard/hotel",
  "/restaurant-dashboard": "/dashboard/restaurant",
  "/supplier-dashboard": "/dashboard/supplier",
  "/services-dashboard": "/dashboard/services",
  "/viewer-dashboard": "/dashboard/viewer",
  "/traveler-dashboard": "/dashboard/viewer",
  "/ai-procurement-dashboard": "/dashboard/main",
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function routeFromPage(file: string) {
  const relative = path.relative(appDir, path.dirname(file)).replace(/\\/g, "/");
  if (!relative) {
    return "/";
  }
  return `/${relative}`.replace(/\/page$/, "");
}

const pageRoutes = new Set(
  walk(appDir)
    .filter((file) => file.endsWith("page.tsx"))
    .map(routeFromPage),
);

for (const route of Object.keys(compatibilityRoutes)) {
  pageRoutes.add(route);
}

const sourceFiles = walk(appDir).filter((file) => /\.(tsx|ts)$/.test(file));
const failures: string[] = [];

for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);
  const hrefRegex = /href=(?:"([^"]*)"|'([^']*)'|{`([^`$]*)[^`]*`}|{\s*"([^"]*)"\s*})/g;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(source))) {
    if (match[0].startsWith("href={`#")) {
      continue;
    }

    const href = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    if (!href || href === "#" || href === "javascript:void(0)") {
      failures.push(`${relative}: invalid href "${href}"`);
      continue;
    }

    if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
      continue;
    }

    if (!href.startsWith("/")) {
      continue;
    }

    const pathname = href.split("?")[0].replace(/\/$/, "") || "/";
    const routeExists =
      pageRoutes.has(pathname) ||
      allowedDynamicPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!routeExists) {
      failures.push(`${relative}: internal href "${href}" does not match an App Router page`);
    }
  }

  if (/javascript:void\(0\)|onClick=\{\(\) => \{\}\}|console\.log\(/.test(source)) {
    failures.push(`${relative}: contains placeholder click or console-only action`);
  }

  const buttonRegex = /<button\b([\s\S]*?)>/g;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonRegex.exec(source))) {
    const attrs = buttonMatch[1] ?? "";
    const typeMatch = attrs.match(/type=(?:"([^"]*)"|'([^']*)')/);
    const type = typeMatch?.[1] ?? typeMatch?.[2] ?? "submit";
    const hasMeaningfulBehavior =
      type === "submit" ||
      /onClick=|formAction=|disabled=|aria-disabled=/.test(attrs);

    if (!hasMeaningfulBehavior) {
      failures.push(`${relative}: button type="${type}" is missing an action or disabled state`);
    }
  }
}

if (!existsSync(path.join(appDir, "not-found.tsx"))) {
  failures.push("app/not-found.tsx is missing");
}

if (!existsSync(path.join(appDir, "error.tsx"))) {
  failures.push("app/error.tsx is missing");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} source files and ${pageRoutes.size} routes.`);
