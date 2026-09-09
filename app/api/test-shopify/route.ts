import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN;
    
    // Simple query to test connection
    const query = `
      query {
        shop {
          name
          description
        }
      }
    `;
    
    const response = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      shop: data.data?.shop,
      message: 'Successfully connected to Shopify!'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}