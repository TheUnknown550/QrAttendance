import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const publicDir = resolve(projectRoot, "public");
const envPath = resolve(projectRoot, ".env");

function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  if (!existsSync(envPath)) {
    return undefined;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const envKey = trimmedLine.slice(0, separatorIndex).trim();
    if (envKey !== key) {
      continue;
    }

    return trimmedLine.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
  }

  return undefined;
}

const siteUrl = (readEnvValue("VITE_SITE_URL") ?? "http://localhost:5173").replace(/\/+$/, "");
const buildDate = new Date().toISOString().slice(0, 10);

const sitemapEntries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/docs", changefreq: "weekly", priority: "0.9" },
  { path: "/help", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (entry) => `  <url>
    <loc>${siteUrl}${entry.path === "/" ? "/" : entry.path}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(resolve(publicDir, "robots.txt"), robots, "utf8");
