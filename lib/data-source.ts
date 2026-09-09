// lib/data-source.ts
import allProductsData from '@/data/all-products.json';

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType?: string;
  vendor?: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: {
          amount: string;
        };
        availableForSale: boolean;
        quantityAvailable?: number;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
        width: number;
        height: number;
      };
    }>;
  };
}

// Load all products from the scraped data
export async function fetchProducts(): Promise<Product[]> {
  try {
    const products = allProductsData || [];
    
    return products.map((p: any) => ({
      id: p.id || '',
      title: p.title || '',
      handle: p.handle || '',
      description: p.description || '',
      productType: p.productType || 'Uncategorized',
      vendor: p.vendor || 'TinySoul',
      variants: {
        edges: (p.variants || []).map((v: any) => ({
          node: {
            id: v.id || '',
            price: {
              amount: v.price || '0',
            },
            availableForSale: v.availableForSale !== undefined ? v.availableForSale : true,
          }
        }))
      },
      images: {
        edges: (p.images || []).map((img: string) => ({
          node: {
            url: img,
            altText: p.title || '',
            width: 400,
            height: 500,
          }
        }))
      }
    }));
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

// Get a single product by handle
export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find(p => p.handle === handle) || null;
}