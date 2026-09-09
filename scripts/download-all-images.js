// scripts/download-all-images.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create images directory
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to get all products from tinysoul.pk
async function fetchAllProducts() {
  // Shopify Storefront API endpoint for tinysoul.pk
  const endpoint = 'https://tinysoul.pk/api/2024-01/graphql.json';
  
  // We need to get the storefront access token
  // You can find this in tinysoul.pk admin > Apps > Storefront API
  // For now, we'll use public access (limited)
  
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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If you have a storefront token, add it here:
        // 'X-Shopify-Storefront-Access-Token': 'your_token_here',
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    return data.data?.products?.edges || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Download a single image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
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

// Get clean filename
function getFileName(title, index) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
  return `${clean}-${index}.jpg`;
}

// Download all images
async function downloadAllImages() {
  console.log('🔍 Fetching all products from tinysoul.pk...');
  
  const products = await fetchAllProducts();
  
  if (products.length === 0) {
    console.log('❌ No products found. You may need to add a Storefront API token.');
    console.log('   Get it from: tinysoul.pk/admin > Settings > Apps > Storefront API');
    return;
  }
  
  console.log(`📦 Found ${products.length} products`);
  console.log('⬇️  Downloading images...\n');
  
  let successCount = 0;
  let failCount = 0;
  let totalImages = 0;
  
  const allProducts = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i].node;
    const images = product.images?.edges || [];
    
    if (images.length === 0) {
      console.log(`⏭️  No images for: ${product.title}`);
      continue;
    }
    
    const productImages = [];
    
    for (let j = 0; j < images.length; j++) {
      const image = images[j].node;
      const imageUrl = image.url;
      
      // Shopify CDN URLs work for tinysoul.pk too
      // They're hosted on cdn.shopify.com
      
      const filename = getFileName(product.title, j);
      const filepath = path.join(imagesDir, filename);
      
      // Check if image already exists
      if (fs.existsSync(filepath)) {
        console.log(`✅ Already exists: ${filename}`);
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
        continue;
      }
      
      try {
        console.log(`⬇️  [${i+1}/${products.length}] ${filename}...`);
        await downloadImage(imageUrl, filepath);
        console.log(`✅ Downloaded: ${filename}`);
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
      } catch (error) {
        console.log(`❌ Failed: ${filename} - ${error.message}`);
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
  
  // Save the product data
  const dataPath = path.join(__dirname, '../data/all-products.json');
  fs.writeFileSync(dataPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`\n📝 Saved product data to: data/all-products.json`);
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount} images`);
  console.log(`   ❌ Failed: ${failCount} images`);
  console.log(`   📁 Total: ${totalImages} images`);
  console.log(`   📁 Images saved to: public/images/products/`);
  console.log(`   📄 ${allProducts.length} products processed`);
}

downloadAllImages().catch(console.error);