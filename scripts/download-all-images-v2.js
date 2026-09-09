// scripts/download-all-images-v2.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create images directory
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a data directory
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch products
async function fetchAllProducts() {
  const endpoint = 'https://tinysoul.pk/api/2024-01/graphql.json';
  
  const query = `
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    console.log('🔄 Fetching products...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const products = data.data?.products?.edges || [];
    console.log(`✅ Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
    return [];
  }
}

// Download a single image with timeout and retry
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    // Set a timeout
    const timeout = setTimeout(() => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(new Error('Timeout after 30 seconds'));
    }, 30000);
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        clearTimeout(timeout);
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        clearTimeout(timeout);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      response.on('end', () => {
        clearTimeout(timeout);
        file.close();
        resolve();
      });
      
      response.on('error', (err) => {
        clearTimeout(timeout);
        file.close();
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      clearTimeout(timeout);
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      clearTimeout(timeout);
      request.destroy();
      file.close();
      fs.unlink(filepath, () => {});
      reject(new Error('Request timeout'));
    });
  });
}

// Download image with retry
async function downloadWithRetry(url, filepath, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   ⬇️  Attempt ${attempt}...`);
      await downloadImage(url, filepath);
      console.log(`   ✅ Downloaded`);
      return true;
    } catch (error) {
      console.log(`   ⚠️  Failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`   ⏳ Waiting 3s before retry...`);
        await delay(3000);
      }
    }
  }
  return false;
}

// Get clean filename
function getFileName(title, index) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 35);
  return `${clean}-${index}.jpg`;
}

// Save progress
function saveProgress(products, filename = 'data/all-products.json') {
  const dataPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
  console.log(`📝 Saved progress to: ${filename}`);
}

// Load existing progress
function loadProgress(filename = 'data/all-products.json') {
  const dataPath = path.join(__dirname, '..', filename);
  if (fs.existsSync(dataPath)) {
    try {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

// Main function
async function downloadAllImages() {
  console.log('🚀 Starting image download (v2)\n');
  
  // Load existing progress
  let allProducts = loadProgress() || [];
  console.log(`📊 Loaded ${allProducts.length} previously processed products`);
  
  // Fetch products
  const products = await fetchAllProducts();
  
  if (products.length === 0) {
    console.log('❌ No products found');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  let totalImages = 0;
  
  // Process each product individually with proper error handling
  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    const product = productData.node;
    const images = product.images?.edges || [];
    
    console.log(`\n📦 [${i+1}/${products.length}] ${product.title.substring(0, 40)}...`);
    
    // Check if this product already exists
    const existingProduct = allProducts.find(p => p.id === product.id);
    if (existingProduct && existingProduct.images.length === images.length) {
      console.log(`   ⏭️  Already processed (${images.length} images)`);
      continue;
    }
    
    if (images.length === 0) {
      console.log('   ⏭️  No images');
      continue;
    }
    
    const productImages = existingProduct?.images || [];
    let allImagesDownloaded = true;
    
    for (let j = 0; j < images.length; j++) {
      const image = images[j].node;
      const imageUrl = image.url;
      const filename = getFileName(product.title, j);
      const filepath = path.join(imagesDir, filename);
      
      if (fs.existsSync(filepath)) {
        if (!productImages.includes(`/images/products/${filename}`)) {
          productImages.push(`/images/products/${filename}`);
        }
        successCount++;
        totalImages++;
        continue;
      }
      
      console.log(`   ⬇️  Downloading image ${j+1}/${images.length}...`);
      const result = await downloadWithRetry(imageUrl, filepath);
      
      if (result) {
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
      } else {
        allImagesDownloaded = false;
        failCount++;
        console.log(`   ❌ Failed after retries`);
      }
      
      // Small delay between images
      await delay(500);
    }
    
    // Save product data
    if (!existingProduct) {
      allProducts.push({
        id: product.id,
        title: product.title,
        handle: product.handle,
        images: productImages,
        price: product.variants?.edges?.[0]?.node?.price?.amount || '0',
        availableForSale: product.variants?.edges?.[0]?.node?.availableForSale || false,
      });
    } else {
      existingProduct.images = productImages;
    }
    
    // Save progress every 3 products
    if (i % 3 === 0) {
      saveProgress(allProducts);
    }
    
    // Progress report
    console.log(`   ✅ ${productImages.length}/${images.length} images downloaded`);
    console.log(`   📊 Total: ${successCount} success, ${failCount} failed`);
    
    // Delay between products to avoid rate limiting
    if (i < products.length - 1) {
      console.log(`   ⏳ Waiting 2s...`);
      await delay(2000);
    }
  }
  
  // Final save
  saveProgress(allProducts);
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(50)}`);
  console.log(`   ✅ Success: ${successCount} images`);
  console.log(`   ❌ Failed: ${failCount} images`);
  console.log(`   📁 Total: ${totalImages} images`);
  console.log(`   📄 ${allProducts.length} products processed`);
  console.log(`   📁 Images saved to: public/images/products/`);
  console.log(`   📄 Data saved to: data/all-products.json`);
}

// Run
downloadAllImages().catch(error => {
  console.error('❌ Error:', error.message);
  console.log('💡 Tip: The script saved progress. Run again to continue where it left off.');
});