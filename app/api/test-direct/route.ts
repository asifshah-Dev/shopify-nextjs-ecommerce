import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN;
    
    if (!domain || !token) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }
    
    const query = `query { shop { name } }`;
    
    const response = await fetch(`https://${domain}/api/unstable/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data: data
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}