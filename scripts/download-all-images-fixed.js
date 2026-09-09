// scripts/download-all-images-fixed.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create images directory
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch all products with retry
async function fetchAllProducts(retries = 3) {
  const endpoint = 'https://tinysoul.pk/api/2024-01/graphql.json';
  
  // Try with public access first, if you have a token add it
  // const token = 'YOUR_TOKEN_HERE';
  
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

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt} to fetch products...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Uncomment if you have a token:
          // 'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.log('⚠️ GraphQL Errors:', data.errors);
        throw new Error('GraphQL query failed');
      }

      const products = data.data?.products?.edges || [];
      console.log(`✅ Found ${products.length} products`);
      return products;
      
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`⏳ Waiting ${attempt * 5} seconds before retry...`);
        await delay(attempt * 5000);
      } else {
        throw error;
      }
    }
  }
  
  return [];
}

// Download a single image with retry
async function downloadImageWithRetry(url, filepath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await downloadImage(url, filepath);
      return true;
    } catch (error) {
      console.log(`   ⚠️ Retry ${attempt}/${retries} for ${path.basename(filepath)}`);
      if (attempt < retries) {
        await delay(2000 * attempt);
      } else {
        throw error;
      }
    }
  }
  return false;
}

// Download a single image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      // Handle errors
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
    
    // Set timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Get clean filename
function getFileName(title, index) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
  return `${clean}-${index}.jpg`;
}

// Process products in batches to avoid rate limiting
async function processBatch(products, batchSize = 5, delayMs = 2000) {
  let successCount = 0;
  let failCount = 0;
  let totalImages = 0;
  const allProducts = [];
  
  // Process in batches
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(products.length / batchSize);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
    
    for (const productData of batch) {
      const product = productData.node;
      const images = product.images?.edges || [];
      
      if (images.length === 0) {
        console.log(`⏭️  No images for: ${product.title.substring(0, 30)}...`);
        continue;
      }
      
      const productImages = [];
      
      for (let j = 0; j < images.length; j++) {
        const image = images[j].node;
        const imageUrl = image.url;
        const filename = getFileName(product.title, j);
        const filepath = path.join(imagesDir, filename);
        
        if (fs.existsSync(filepath)) {
          productImages.push(`/images/products/${filename}`);
          successCount++;
          totalImages++;
          continue;
        }
        
        try {
          console.log(`⬇️  ${filename}...`);
          await downloadImageWithRetry(imageUrl, filepath);
          console.log(`   ✅ Downloaded`);
          productImages.push(`/images/products/${filename}`);
          successCount++;
          totalImages++;
          
          // Small delay between images
          await delay(500);
          
        } catch (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          failCount++;
        }
      }
      
      allProducts.push({
        id: product.id,
        title: product.title,
        handle: product.handle,
        images: productImages,
        price: product.variants?.edges?.[0]?.node?.price?.amount || '0',
        availableForSale: product.variants?.edges?.[0]?.node?.availableForSale || false,
      });
    }
    
    // Delay between batches
    if (i + batchSize < products.length) {
      console.log(`⏳ Waiting ${delayMs/1000}s before next batch...`);
      await delay(delayMs);
    }
    
    // Progress report
    const processed = Math.min(i + batchSize, products.length);
    console.log(`📊 Progress: ${processed}/${products.length} products processed`);
  }
  
  return { allProducts, successCount, failCount, totalImages };
}

// Main function
async function downloadAllImages() {
  console.log('🚀 Starting image download from tinysoul.pk');
  console.log('📁 Images will be saved to: public/images/products/\n');
  
  let products = [];
  
  try {
    products = await fetchAllProducts(3);
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
    console.log('\n💡 Tip: You may need to add a Storefront API token.');
    console.log('   Get it from: tinysoul.pk/admin > Settings > Apps > Storefront API');
    console.log('   Then uncomment the token line in the script.');
    return;
  }
  
  if (products.length === 0) {
    console.log('❌ No products found.');
    return;
  }
  
  console.log(`📦 Found ${products.length} products\n`);
  
  // Process products in small batches to avoid rate limiting
  const { allProducts, successCount, failCount, totalImages } = await processBatch(
    products,
    3,  // batch size (products per batch)
    3000 // delay between batches (ms)
  );
  
  // Save the product data
  const dataPath = path.join(__dirname, '../data/all-products.json');
  fs.writeFileSync(dataPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`\n📝 Saved product data to: data/all-products.json`);
  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Success: ${successCount} images`);
  console.log(`   ❌ Failed: ${failCount} images`);
  console.log(`   📁 Total: ${totalImages} images`);
  console.log(`   📄 ${allProducts.length} products processed`);
  console.log(`   📁 Images saved to: public/images/products/`);
}

// Run with error handling
downloadAllImages().catch(error => {
  console.error('❌ Unexpected error:', error.message);
  console.log('\n💡 Try running again - the script will skip already downloaded images.');
});