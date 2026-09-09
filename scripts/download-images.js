// scripts/download-images.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read the product data
const productsPath = path.join(__dirname, '../data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Create images directory
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Map of product titles to clean filenames
const getFileName = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '.jpg';
};

// Download a single image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Download all images
async function downloadAllImages() {
  console.log(`📦 Downloading images for ${products.length} products...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const imageUrl = product.images?.edges?.[0]?.node?.url;
    
    if (!imageUrl) {
      console.log(`❌ No image URL for: ${product.title}`);
      failCount++;
      continue;
    }
    
    const filename = getFileName(product.title);
    const filepath = path.join(imagesDir, filename);
    
    // Update the product data with local image path
    product.images.edges[0].node.url = `/images/products/${filename}`;
    
    // Check if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`✅ Already exists: ${filename}`);
      successCount++;
      continue;
    }
    
    try {
      console.log(`⬇️  Downloading: ${filename}...`);
      await downloadImage(imageUrl, filepath);
      console.log(`✅ Downloaded: ${filename}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed: ${filename} - ${error.message}`);
      failCount++;
    }
  }
  
  // Save updated products with local image paths
  const updatedProductsPath = path.join(__dirname, '../data/products.json');
  fs.writeFileSync(updatedProductsPath, JSON.stringify(products, null, 2));
  console.log(`\n📝 Updated products.json with local image paths`);
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Images saved to: public/images/products/`);
}

downloadAllImages().catch(console.error);