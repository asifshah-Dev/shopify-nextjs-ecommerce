// scripts/scrape-fresh.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('🚀 STARTING FRESH SCRAPE');
console.log('='.repeat(50));

// Configuration
const CONFIG = {
  // Set to true to start fresh (delete everything)
  FRESH_START: true,
  // Max retries per image
  MAX_RETRIES: 2,
  // Timeout per image in ms
  TIMEOUT: 20000,
  // Delay between images
  IMAGE_DELAY: 500,
  // Delay between products
  PRODUCT_DELAY: 1000,
  // Save progress every N products
  SAVE_INTERVAL: 3,
};

// Directories
const imagesDir = path.join(__dirname, '../public/images/products');
const dataDir = path.join(__dirname, '../data');

// Delete everything if fresh start
if (CONFIG.FRESH_START) {
  console.log('🗑️  Fresh start - deleting existing data...');
  
  // Delete images folder
  if (fs.existsSync(imagesDir)) {
    fs.rmSync(imagesDir, { recursive: true, force: true });
    console.log('   ✅ Deleted images folder');
  }
  
  // Delete data files
  ['all-products.json', 'products-progress.json', 'tinysoul-full-data.json', 'product-list.json'].forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`   ✅ Deleted ${file}`);
    }
  });
  
  console.log('   ✅ Fresh start ready!\n');
}

// Create directories
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing progress (if not fresh start)
let existingProducts = [];
const progressFile = path.join(dataDir, 'products-progress.json');
if (!CONFIG.FRESH_START && fs.existsSync(progressFile)) {
  try {
    existingProducts = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    console.log(`📊 Loaded ${existingProducts.length} previously processed products\n`);
  } catch (e) {
    console.log('⚠️ Could not load progress, starting fresh\n');
  }
}

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all products
async function fetchAllProducts() {
  const endpoint = 'https://tinysoul.pk/api/2024-01/graphql.json';
  
  const query = `
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            handle
            vendor
            productType
            tags
            createdAt
            updatedAt
            publishedAt
            seo {
              title
              description
            }
            options {
              id
              name
              values
            }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
            images(first: 20) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            collections(first: 5) {
              edges {
                node {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    console.log('🔄 Fetching products from tinysoul.pk...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    const products = data.data?.products?.edges || [];
    console.log(`✅ Found ${products.length} products\n`);
    return products;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
    return [];
  }
}

// Download a single image with timeout
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    let timeout = setTimeout(() => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(new Error('Timeout'));
    }, CONFIG.TIMEOUT);
    
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
        file.close();
        fs.unlink(filepath, () => {});
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
    
    request.setTimeout(CONFIG.TIMEOUT, () => {
      clearTimeout(timeout);
      request.destroy();
      file.close();
      fs.unlink(filepath, () => {});
      reject(new Error('Request timeout'));
    });
  });
}

// Download with retry
async function downloadWithRetry(url, filepath) {
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      await downloadImage(url, filepath);
      return { success: true };
    } catch (error) {
      const isTimeout = error.message === 'Timeout' || error.message === 'Request timeout';
      if (attempt < CONFIG.MAX_RETRIES) {
        console.log(`   ⚠️  Retry ${attempt}/${CONFIG.MAX_RETRIES}...`);
        await delay(2000);
      } else {
        console.log(`   ❌ Failed after ${CONFIG.MAX_RETRIES} attempts: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

// Get filename
function getFileName(title, index) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
  return `${clean}-${index}.jpg`;
}

// Check if product already processed
function isProductProcessed(productId) {
  return existingProducts.some(p => p.id === productId);
}

// Main scraping function
async function scrapeAll() {
  // Fetch products
  const products = await fetchAllProducts();
  
  if (products.length === 0) {
    console.log('❌ No products found. Check your connection.');
    return;
  }
  
  // Filter out already processed products
  let productsToProcess = products;
  if (!CONFIG.FRESH_START && existingProducts.length > 0) {
    productsToProcess = products.filter(p => !isProductProcessed(p.node.id));
    console.log(`📊 Skipping ${products.length - productsToProcess.length} already processed products`);
    console.log(`📦 Processing ${productsToProcess.length} new products\n`);
  }
  
  let successCount = 0;
  let failCount = 0;
  let totalImages = 0;
  let failedImages = [];
  
  // Process each product
  for (let i = 0; i < productsToProcess.length; i++) {
    const productNode = productsToProcess[i].node;
    const images = productNode.images?.edges || [];
    const productIndex = i + 1;
    const total = productsToProcess.length;
    
    console.log(`\n📦 [${productIndex}/${total}] ${productNode.title.substring(0, 50)}`);
    console.log(`   🏷️  ${productNode.productType || 'Uncategorized'}`);
    console.log(`   💰 Price: ${productNode.variants?.edges?.[0]?.node?.price?.amount || 'N/A'}`);
    console.log(`   📸 Images: ${images.length}`);
    
    const productImages = [];
    
    // Download each image
    for (let j = 0; j < images.length; j++) {
      const image = images[j].node;
      const imageUrl = image.url;
      const filename = getFileName(productNode.title, j);
      const filepath = path.join(imagesDir, filename);
      
      // Skip if image already exists
      if (fs.existsSync(filepath)) {
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
        console.log(`   ✅ Image ${j+1}/${images.length} already exists`);
        continue;
      }
      
      console.log(`   ⬇️  Downloading image ${j+1}/${images.length}...`);
      const result = await downloadWithRetry(imageUrl, filepath);
      
      if (result.success) {
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
        console.log(`   ✅ Downloaded`);
      } else {
        failCount++;
        failedImages.push({ product: productNode.title, url: imageUrl, error: result.error });
        console.log(`   ⚠️  Skipped - will try again if script re-run`);
      }
      
      // Small delay between images
      await delay(CONFIG.IMAGE_DELAY);
    }
    
    // Build product data
    const variants = productNode.variants?.edges || [];
    const variantData = variants.map((v) => ({
      id: v.node.id,
      title: v.node.title,
      price: v.node.price?.amount || '0',
      compareAtPrice: v.node.compareAtPrice?.amount || null,
      availableForSale: v.node.availableForSale || false,
      selectedOptions: v.node.selectedOptions || [],
    }));
    
    const collections = productNode.collections?.edges || [];
    const collectionData = collections.map((c) => ({
      id: c.node.id,
      title: c.node.title,
      handle: c.node.handle,
    }));
    
    const productData = {
      id: productNode.id,
      title: productNode.title,
      handle: productNode.handle,
      description: productNode.description || '',
      descriptionHtml: productNode.descriptionHtml || '',
      vendor: productNode.vendor || '',
      productType: productNode.productType || '',
      tags: productNode.tags || [],
      seo: {
        title: productNode.seo?.title || '',
        description: productNode.seo?.description || '',
      },
      options: productNode.options || [],
      variants: variantData,
      images: productImages,
      collections: collectionData,
      createdAt: productNode.createdAt,
      updatedAt: productNode.updatedAt,
      publishedAt: productNode.publishedAt,
    };
    
    // Add to existing products
    existingProducts.push(productData);
    
    // Save progress every N products
    if (productIndex % CONFIG.SAVE_INTERVAL === 0) {
      fs.writeFileSync(progressFile, JSON.stringify(existingProducts, null, 2));
      console.log(`   💾 Progress saved (${existingProducts.length} products)`);
    }
    
    // Delay between products
    if (i < productsToProcess.length - 1) {
      await delay(CONFIG.PRODUCT_DELAY);
    }
  }
  
  // Final save
  fs.writeFileSync(progressFile, JSON.stringify(existingProducts, null, 2));
  
  // Generate categories
  const categories = {};
  existingProducts.forEach(p => {
    const type = p.productType || 'Uncategorized';
    if (!categories[type]) {
      categories[type] = { name: type, count: 0, products: [] };
    }
    categories[type].count++;
    categories[type].products.push(p.id);
  });
  
  // Create final data
  const finalData = {
    storeInfo: {
      name: 'TinySoul',
      domain: 'tinysoul.pk',
      totalProducts: existingProducts.length,
      totalCategories: Object.keys(categories).length,
      scrapedAt: new Date().toISOString(),
    },
    categories: Object.values(categories),
    products: existingProducts,
    stats: {
      totalImages: totalImages,
      downloadedImages: successCount,
      failedImages: failCount,
      failedImageList: failedImages.slice(0, 10), // First 10 failures
    }
  };
  
  // Save final files
  fs.writeFileSync(path.join(dataDir, 'tinysoul-full-data.json'), JSON.stringify(finalData, null, 2));
  fs.writeFileSync(path.join(dataDir, 'all-products.json'), JSON.stringify(existingProducts, null, 2));
  
  const simpleList = existingProducts.map(p => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    price: p.variants[0]?.price || '0',
    image: p.images[0] || null,
  }));
  fs.writeFileSync(path.join(dataDir, 'product-list.json'), JSON.stringify(simpleList, null, 2));
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`   📦 Products: ${existingProducts.length}`);
  console.log(`   📂 Categories: ${Object.keys(categories).length}`);
  console.log(`   🖼️  Images Downloaded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total Images: ${totalImages}`);
  if (failedImages.length > 0) {
    console.log(`\n⚠️ ${failedImages.length} images failed. Run the script again to retry.`);
  }
  console.log(`\n📄 Files Created:`);
  console.log(`   📄 data/tinysoul-full-data.json`);
  console.log(`   📄 data/all-products.json`);
  console.log(`   📄 data/product-list.json`);
  console.log(`   📁 public/images/products/`);
  console.log('\n✅ DONE!');
}

// Run the scraper
scrapeAll().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.log('\n💡 Run the script again - it will resume from where it stopped.');
});