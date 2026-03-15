// build-articles.js
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ===== CONFIGURATION =====
const SITE_URL = 'https://ycibangladesh.org';  // ← UPDATE to your domain
const CONTENT_DIR = './content';               // ← index.json location
const ARTICLES_DIR = './content/articles';     // ← Articles MD files location
const OUTPUT_DIR = './article-posts';          // ← Generated article HTML output
const TEMPLATE_FILE = './article-template.html';

// ===== YAML Parser =====
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

// ===== Generate Slug from Title =====
function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

// ===== Resolve Image URL (Must be absolute for Facebook) =====
function resolveImageURL(imagePath) {
  if (!imagePath) return `${SITE_URL}/content/images/IMG_5811.png`;
  
  // Already full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Absolute path from root (starts with /)
  if (imagePath.startsWith('/')) {
    return `${SITE_URL}${imagePath}`;
  }
  
  // Relative path - assume it's in /content/images/
  return `${SITE_URL}/content/images/${imagePath}`;
}

// ===== Main Build Function =====
function build() {
  console.log('🔨 Starting article build...\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 Created output directory:', OUTPUT_DIR);
  }
  
  // Read index.json from ./content/
  const indexPath = path.join(CONTENT_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Error: index.json not found in', CONTENT_DIR);
    process.exit(1);
  }
  
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const articleFiles = index.articles || [];  // ← Get articles array
  
  console.log(`📚 Found ${articleFiles.length} article file(s)\n`);
  
  // Read template
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('❌ Error: article-template.html not found');
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  
  // Generate HTML for each article
  let successCount = 0;
  let errorCount = 0;
  
  articleFiles.forEach((file) => {
    try {
      // File path is relative to content/ folder
      const filePath = path.join(CONTENT_DIR, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} - File not found`);
        errorCount++;
        return;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const parts = content.split('---');
      
      if (parts.length < 3) {
        console.log(`⚠️  Skipping ${file} - Invalid format (need 3 parts separated by ---)`);
        errorCount++;
        return;
      }
      
      const meta = parseYAML(parts[1]);
      const body = parts.slice(2).join('---');
      const slug = meta.slug || generateSlug(meta.title);
      const imageURL = resolveImageURL(meta.image);
      const excerpt = meta.description || 
        body.replace(/[#*_\-[\]()`>]/g, '').substring(0, 200).trim() + '…';
      const date = meta.date ? 
        new Date(meta.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : '';
      
      // Replace placeholders in template
      let html = template
        .replace(/{{OG_TITLE}}/g, meta.title || 'YCI Bangladesh Article')
        .replace(/{{OG_DESCRIPTION}}/g, excerpt)
        .replace(/{{OG_IMAGE}}/g, imageURL)
        .replace(/{{OG_URL}}/g, `${SITE_URL}/article-posts/${slug}.html`)
        .replace(/{{PAGE_TITLE}}/g, `${meta.title} - YCI Bangladesh`)
        .replace(/{{ARTICLE_TITLE}}/g, meta.title || 'Untitled')
        .replace(/{{ARTICLE_AUTHOR}}/g, meta.author || 'YCI Bangladesh')
        .replace(/{{ARTICLE_DATE}}/g, date)
        .replace(/{{ARTICLE_CONTENT}}/g, marked.parse(body))
        .replace(/{{ARTICLE_IMAGE}}/g, imageURL);
      
      // Save HTML file
      const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);
      fs.writeFileSync(outputPath, html);
      
      console.log(`✅ Generated: ${slug}.html`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Article Build Complete!`);
  console.log(`   ✅ Success: ${successCount} file(s)`);
  console.log(`   ⚠️  Errors: ${errorCount} file(s)`);
  console.log(`   📁 Output: ${OUTPUT_DIR}/`);
  console.log('='.repeat(50));
}

// Run build
build();