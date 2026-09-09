// scripts/scrape-all-products-fixed.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create directories
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllProducts() {
  const endpoint = 'https://tinysoul.pk/api/2024-01/graphql.json';
  
  // REMOVED quantityAvailable - we don't need it since we're leaving Shopify
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
    console.log('🔄 Fetching ALL products from tinysoul.pk...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ GraphQL Errors:', data.errors);
      // Continue anyway - we can still get product data without inventory
    }
    
    const products = data.data?.products?.edges || [];
    console.log(`✅ Found ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
    return [];
  }
}

// Download image with retry
async function downloadImage(url, filepath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        const timeout = setTimeout(() => {
          file.close();
          fs.unlink(filepath, () => {});
          reject(new Error('Timeout'));
        }, 30000);
        
        const request = protocol.get(url, (response) => {
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
          response.on('error', reject);
        });
        
        request.on('error', reject);
        request.setTimeout(30000, () => {
          request.destroy();
          reject(new Error('Request timeout'));
        });
      });
      return true;
    } catch (error) {
      console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        await delay(2000);
      }
    }
  }
  return false;
}

function getFileName(title, index) {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 35);
  return `${clean}-${index}.jpg`;
}

async function processProducts(products) {
  const allProducts = [];
  let successCount = 0;
  let failCount = 0;
  let totalImages = 0;
  
  console.log(`\n📦 Processing ${products.length} products...\n`);
  
  for (let i = 0; i < products.length; i++) {
    const productNode = products[i].node;
    const images = productNode.images?.edges || [];
    
    console.log(`\n📦 [${i+1}/${products.length}] ${productNode.title}`);
    console.log(`   🏷️  ${productNode.productType || 'Uncategorized'}`);
    console.log(`   💰 Price: ${productNode.variants?.edges?.[0]?.node?.price?.amount || 'N/A'}`);
    console.log(`   📸 Images: ${images.length}`);
    
    const productImages = [];
    
    for (let j = 0; j < images.length; j++) {
      const image = images[j].node;
      const imageUrl = image.url;
      const filename = getFileName(productNode.title, j);
      const filepath = path.join(imagesDir, filename);
      
      if (fs.existsSync(filepath)) {
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
        continue;
      }
      
      console.log(`   ⬇️  Downloading image ${j+1}/${images.length}...`);
      const result = await downloadImage(imageUrl, filepath);
      
      if (result) {
        productImages.push(`/images/products/${filename}`);
        successCount++;
        totalImages++;
        console.log(`   ✅ Downloaded`);
      } else {
        failCount++;
        console.log(`   ❌ Failed`);
      }
      
      await delay(300);
    }
    
    // Get variant data - without quantityAvailable
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
    
    allProducts.push(productData);
    
    if ((i + 1) % 5 === 0) {
      const progressPath = path.join(dataDir, 'products-progress.json');
      fs.writeFileSync(progressPath, JSON.stringify(allProducts, null, 2));
      console.log(`   💾 Saved progress (${allProducts.length} products)`);
    }
    
    if (i < products.length - 1) {
      await delay(1000);
    }
  }
  
  return { allProducts, successCount, failCount, totalImages };
}

function generateCategories(products) {
  const categories = {};
  
  products.forEach(p => {
    const type = p.productType || 'Uncategorized';
    if (!categories[type]) {
      categories[type] = {
        name: type,
        count: 0,
        products: []
      };
    }
    categories[type].count++;
    categories[type].products.push(p.id);
  });
  
  return Object.values(categories);
}

async function scrapeAll() {
  console.log('🚀 Starting FULL product scrape of tinysoul.pk');
  console.log('='.repeat(50));
  
  const products = await fetchAllProducts();
  
  if (products.length === 0) {
    console.log('❌ No products found. Exiting.');
    return;
  }
  
  const { allProducts, successCount, failCount, totalImages } = await processProducts(products);
  const categories = generateCategories(allProducts);
  
  const finalData = {
    storeInfo: {
      name: 'TinySoul',
      domain: 'tinysoul.pk',
      totalProducts: allProducts.length,
      totalCategories: categories.length,
      scrapedAt: new Date().toISOString(),
    },
    categories: categories,
    products: allProducts,
    stats: {
      totalImages: totalImages,
      downloadedImages: successCount,
      failedImages: failCount,
    }
  };
  
  const outputPath = path.join(dataDir, 'tinysoul-full-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
  
  const productsPath = path.join(dataDir, 'all-products.json');
  fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));
  
  const simpleList = allProducts.map(p => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    price: p.variants[0]?.price || '0',
    image: p.images[0] || null,
  }));
  const simplePath = path.join(dataDir, 'product-list.json');
  fs.writeFileSync(simplePath, JSON.stringify(simpleList, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`   📦 Products: ${allProducts.length}`);
  console.log(`   📂 Categories: ${categories.length}`);
  console.log(`   🖼️  Images Downloaded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total Images: ${totalImages}`);
  console.log(`\n📄 Files Created:`);
  console.log(`   📄 data/tinysoul-full-data.json - Complete data with images`);
  console.log(`   📄 data/all-products.json - All products`);
  console.log(`   📄 data/product-list.json - Simple product list`);
  console.log(`   📁 public/images/products/ - All product images`);
  console.log('\n✅ DONE!');
}

scrapeAll().catch(error => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Run again - it will skip already downloaded images.');
});