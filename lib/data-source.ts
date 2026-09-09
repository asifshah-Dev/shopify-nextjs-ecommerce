// lib/data-source.ts
import { Product } from '@/types';
import allProducts from '@/data/all-products.json';

export async function fetchProducts(): Promise<Product[]> {
  // Return the scraped products in your app's format
  return allProducts.map(p => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description,
    productType: p.productType || 'Uncategorized',
    vendor: p.vendor || 'TinySoul',
    variants: {
      edges: p.variants.map(v => ({
        node: {
          id: v.id,
          price: {
            amount: v.price,
          },
          availableForSale: v.availableForSale,
          quantityAvailable: 0,
        }
      }))
    },
    images: {
      edges: p.images.map(img => ({
        node: {
          url: img,
          altText: p.title,
          width: 400,
          height: 500,
        }
      }))
    }
  }));
}

export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find(p => p.handle === handle) || null;
}