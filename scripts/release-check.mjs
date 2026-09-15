import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const failures = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function fail(message) {
  failures.push(message);
}

// 1) Package/app version consistency.
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const appConfig = fs.readFileSync(path.join(src, "config/app.ts"), "utf8");
const configVersion = appConfig.match(/version:\s*["']([^"']+)["']/)?.[1];
if (!configVersion || configVersion !== pkg.version) {
  fail(`Version mismatch: package.json=${pkg.version}, APP_CONFIG=${configVersion ?? "missing"}`);
}

// 2) Alias imports must resolve to a TS/TSX module.
for (const file of walk(src).filter((file) => /\.tsx?$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/from\s+["'](@\/[^"']+)["']/g)) {
    const rel = match[1].slice(2);
    const candidates = [
      path.join(src, `${rel}.ts`),
      path.join(src, `${rel}.tsx`),
      path.join(src, rel, "index.ts"),
      path.join(src, rel, "index.tsx"),
    ];
    if (!candidates.some(fs.existsSync)) fail(`Missing alias import ${match[1]} in ${path.relative(root, file)}`);
  }
}

// 2b) Relative TS/TSX imports must resolve.
for (const file of walk(src).filter((file) => /\.tsx?$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const candidates = [
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ];
    if (!candidates.some(fs.existsSync)) fail(`Missing relative import ${match[1]} in ${path.relative(root, file)}`);
  }
}

// 3) Static internal hrefs must point at an App Router page.
const routes = new Set(["/"]);
for (const page of walk(path.join(src, "app")).filter((file) => file.endsWith(`${path.sep}page.tsx`))) {
  const relative = path.relative(path.join(src, "app"), path.dirname(page));
  routes.add(relative ? `/${relative.split(path.sep).join("/")}` : "/");
}
function routeExists(href) {
  if (routes.has(href)) return true;
  for (const route of routes) {
    if (!route.includes("[id]")) continue;
    const pattern = new RegExp(`^${route.replace("[id]", "[^/]+")}$`);
    if (pattern.test(href)) return true;
  }
  return false;
}
for (const file of walk(src).filter((file) => file.endsWith(".tsx"))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/href=["'](\/[^"'${}]*)["']/g)) {
    if (!routeExists(match[1])) fail(`Static href ${match[1]} has no page (${path.relative(root, file)})`);
  }
}

// 4) Basic CSS structure check.
const css = fs.readFileSync(path.join(src, "app/globals.css"), "utf8");
let depth = 0;
for (const char of css) {
  if (char === "{") depth += 1;
  if (char === "}") depth -= 1;
  if (depth < 0) break;
}
if (depth !== 0) fail(`globals.css brace balance is ${depth}`);

// 5) Official OG asset must exist and be 1200x630 PNG.
const ogPath = path.join(root, "public/og.png");
if (!fs.existsSync(ogPath)) {
  fail("public/og.png is missing");
} else {
  const png = fs.readFileSync(ogPath);
  const signature = png.subarray(0, 8).toString("hex");
  const width = png.length >= 24 ? png.readUInt32BE(16) : 0;
  const height = png.length >= 24 ? png.readUInt32BE(20) : 0;
  if (signature !== "89504e470d0a1a0a" || width !== 1200 || height !== 630) {
    fail(`public/og.png must be PNG 1200x630 (found ${width}x${height})`);
  }
}

if (failures.length) {
  console.error("SEMFORM release check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`SEMFORM release check passed · ${routes.size} routes · v${pkg.version}`);
