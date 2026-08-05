/**
 * generateIndex.js
 * -----------------
 * Scans content folders (articles, teams, services, announcement)
 * and creates content/index.json for your static site, ordered by rank.
 *
 * Safe for Pages CMS + random filenames.
 */

import { promises as fs } from "fs";
import path from "path";

// ---- Configuration ----
const CONTENT_DIR = path.resolve("./content");
const OUTPUT_FILE = path.join(CONTENT_DIR, "index.json");

// Helper: check if file is Markdown
const isMarkdown = (filename) => filename.toLowerCase().endsWith(".md");

// Helper: scan folder recursively
async function scanFolder(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    return files.filter(isMarkdown);
  } catch {
    return []; // folder might not exist yet
  }
}

// Helper: parse YAML frontmatter
function parseYAML(yamlStr) {
  const result = {};
  yamlStr.trim().split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    let key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    if (!isNaN(val) && val !== '') val = Number(val);
    result[key] = val;
  });
  return result;
}

// Helper: get rank of a markdown file
async function getFileRank(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parts = content.split('---');
    if (parts.length >= 3) {
      const meta = parseYAML(parts[1]);
      if (meta.rank !== undefined && meta.rank !== null && !isNaN(meta.rank)) {
        return Number(meta.rank);
      }
    }
  } catch {}
  return -999999;
}

async function generateIndex() {
  console.log(" Generating content index...");

  const collections = ["articles", "teams", "services", "announcement"];
  const indexData = {};

  for (const name of collections) {
    const folderPath = path.join(CONTENT_DIR, name);
    const files = await scanFolder(folderPath);

    const items = await Promise.all(
      files.map(async (f) => {
        const filePath = path.join(folderPath, f);
        const rank = await getFileRank(filePath);
        return { filename: f, rank };
      })
    );

    items.sort((a, b) => b.rank - a.rank);

    indexData[name] = items.map((item) => `${name}/${item.filename}`);
  }

  // Ensure content folder exists
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  // Write index.json
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(indexData, null, 2));

  console.log("content/index.json created successfully!");
  console.log(JSON.stringify(indexData, null, 2));
}

// Run script
generateIndex().catch((err) => {
  console.error("Failed to generate content index:", err);
  process.exit(1);
});