import Link from 'next/link';
import { notFound } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify';
import ProductsClient from '@/components/ProductsClient';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const query = `
    query getCollection($handle: String!) {
      collection(handle: $handle) {
        title
        description
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
                    id
                    price { amount }
                    availableForSale
                    quantityAvailable
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
    }
  `;

  try {
    const data = await shopifyFetch(query, { handle });
    const collection = data.data?.collection;

    if (!collection) notFound();

    const products = collection.products?.edges?.map((edge: any) => edge.node) || [];

    return (
      <main className="bg-zinc-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <nav className="text-sm text-zinc-500 mb-6">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900">{collection.title}</span>
          </nav>

          <header className="mb-8 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">{collection.title}</h1>
            {collection.description && (
              <p className="mt-3 text-zinc-600">{collection.description}</p>
            )}
          </header>

          {products.length > 0 ? (
            <ProductsClient initialProducts={products} />
          ) : (
            <div className="bg-white rounded-xl p-10 text-center text-zinc-500">
              This collection has no products yet.
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading collection:', error);
    notFound();
  }
}