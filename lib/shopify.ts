// Environment validation - only runs on server
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN;

// Only validate on server side
if (typeof window === 'undefined') {
  if (!domain || !token) {
    throw new Error('Missing Shopify environment variables');
  }
}

const endpoint = `https://${domain}/api/2024-07/graphql.json`;

// Reusable fetch function - only used on server
export async function shopifyFetch(query: string, variables?: any) {
  // Only allow server-side usage
  if (typeof window !== 'undefined') {
    throw new Error('shopifyFetch can only be used on the server');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token!,
      },
      body: JSON.stringify({
        query,
        variables
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('Shopify errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'Shopify API error');
    }
    
    return data;
    
  } catch (error: any) {
    console.error('Fetch error:', error.message);
    throw error;
  }
}