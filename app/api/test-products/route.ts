import { NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET() {
  try {
    const query = `
      query {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
              description
              variants(first: 1) {
                edges {
                  node {
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    console.log('🔵 Fetching products...');
    const data = await shopifyFetch(query);
    console.log('✅ Response received:', JSON.stringify(data, null, 2));
    
    const products = data.data?.products?.edges || [];
    
    return NextResponse.json({
      success: true,
      productCount: products.length,
      products: products.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        price: edge.node.variants.edges[0]?.node.price.amount || '0.00',
        inStock: edge.node.variants.edges[0]?.node.availableForSale || false,
        image: edge.node.images.edges[0]?.node.url || null,
      }))
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}