// lib/data-source.ts
import productsData from '@/data/all-products.json';

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType?: string;
  vendor?: string;
  price?: string;
  image?: string | null;
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: {
          amount: string;
        };
        availableForSale: boolean;
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

export async function fetchProducts(): Promise<Product[]> {
  try {
    return productsData.map((p: any) => {
      // Get images from the images array
      const imageUrls = p.images || [];
      
      // Get price from first variant or direct price
      const priceAmount = p.variants?.[0]?.price || p.price || '0';
      
      return {
        id: p.id || '',
        title: p.title || '',
        handle: p.handle || '',
        description: p.description || '',
        productType: p.productType || 'Uncategorized',
        vendor: p.vendor || 'TinySoul',
        price: priceAmount,
        image: imageUrls.length > 0 ? imageUrls[0] : null,
        variants: {
          edges: (p.variants || []).map((v: any) => ({
            node: {
              id: v.id || '',
              price: {
                amount: v.price || priceAmount,
              },
              availableForSale: v.availableForSale !== undefined ? v.availableForSale : true,
            }
          }))
        },
        images: {
          edges: imageUrls.map((img: string) => ({
            node: {
              url: img,
              altText: p.title || '',
              width: 400,
              height: 500,
            }
          }))
        }
      };
    });
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find(p => p.handle === handle) || null;
}