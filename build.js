// build.js
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ===== CONFIGURATION =====
const SITE_URL = 'https://ycibangladesh.org';  // ← UPDATE to your domain
const CONTENT_DIR = './content';               // ← index.json location
const OUTPUT_DIR = './blog-posts';             // ← Generated HTML output
const TEMPLATE_FILE = './blog-template.html';

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
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/')) {
    return `${SITE_URL}${imagePath}`;
  }
  
  return `${SITE_URL}${imagePath}`;
}

// ===== Main Build Function =====
function build() {
  console.log('🔨 Starting build...\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 Created output directory:', OUTPUT_DIR);
  }
  
  // Read blog index from ./content/index.json
  const indexPath = path.join(CONTENT_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Error: index.json not found in', CONTENT_DIR);
    process.exit(1);
  }
  
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const blogFiles = index.services || [];  // ← Get services array
  
  console.log(`📚 Found ${blogFiles.length} blog file(s) in services\n`);
  
  // Read template
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('❌ Error: blog-template.html not found');
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  
  // Generate HTML for each blog
  let successCount = 0;
  let errorCount = 0;
  
  blogFiles.forEach((file, index) => {
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
        console.log(`⚠️  Skipping ${file} - Invalid format`);
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
        .replace(/{{OG_TITLE}}/g, meta.title || 'YCI Bangladesh Blog')
        .replace(/{{OG_DESCRIPTION}}/g, excerpt)
        .replace(/{{OG_IMAGE}}/g, imageURL)
        .replace(/{{OG_URL}}/g, `${SITE_URL}/blog-posts/${slug}.html`)
        .replace(/{{PAGE_TITLE}}/g, `${meta.title} - YCI Bangladesh`)
        .replace(/{{BLOG_TITLE}}/g, meta.title || 'Untitled')
        .replace(/{{BLOG_AUTHOR}}/g, meta.author || 'YCI Bangladesh')
        .replace(/{{BLOG_DATE}}/g, date)
        .replace(/{{BLOG_CONTENT}}/g, marked.parse(body))
        .replace(/{{BLOG_IMAGE}}/g, imageURL);
      
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
  console.log(`🎉 Build Complete!`);
  console.log(`   ✅ Success: ${successCount} file(s)`);
  console.log(`   ⚠️  Errors: ${errorCount} file(s)`);
  console.log(`   📁 Output: ${OUTPUT_DIR}/`);
  console.log('='.repeat(50));
}

// Run build
build();