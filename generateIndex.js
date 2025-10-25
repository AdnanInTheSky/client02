/**
 * generateIndex.js
 * -----------------
 * Scans content folders (articles, teams, services)
 * and creates content/index.json for your static site.
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

async function generateIndex() {
  console.log("📦 Generating content index...");

  const collections = ["articles", "teams", "services"];
  const indexData = {};

  for (const name of collections) {
    const folderPath = path.join(CONTENT_DIR, name);
    const files = await scanFolder(folderPath);
    indexData[name] = files.map((f) => `${name}/${f}`);
  }

  // Ensure content folder exists
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  // Write index.json
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(indexData, null, 2));

  console.log("✅ content/index.json created successfully!");
  console.log(JSON.stringify(indexData, null, 2));
}

// Run script
generateIndex().catch((err) => {
  console.error("❌ Failed to generate content index:", err);
  process.exit(1);
});