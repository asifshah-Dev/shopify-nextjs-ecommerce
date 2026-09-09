import { shopifyFetch } from '@/lib/shopify';
import ProductsClient from '@/components/ProductsClient';

export default async function ProductsPage() {
  const query = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            variants(first: 1) {
              edges {
                node {
                  price { amount }
                  availableForSale
                }
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const data = await shopifyFetch(query) as { data: any };
  const products = data.data?.products?.edges?.map((edge: any) => edge.node) || [];

  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">All Products</h1>
        <ProductsClient initialProducts={products} />
      </div>
    </main>
  );
}