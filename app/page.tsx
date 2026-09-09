import { shopifyFetch } from '@/lib/shopify';
import Hero from '@/components/Hero';
import ProductsClient from '@/components/ProductsClient';

export default async function Home() {
  // Fetch products
  const productsQuery = `
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

  // Fetch collections for hero
  const collectionsQuery = `
    query {
      collections(first: 5) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  `;

  const [productsData, collectionsData] = await Promise.all([
    shopifyFetch(productsQuery),
    shopifyFetch(collectionsQuery),
  ]);

  const products = productsData.data?.products?.edges?.map((edge: any) => edge.node) || [];
  const collections = collectionsData.data?.collections?.edges || [];

  // Build hero slides
  const heroSlides = collections.map(({ node: collection }: any) => ({
    id: collection.id,
    title: collection.title || 'Collection',
    subtitle: 'Collection',
    description: collection.description?.substring(0, 120) || '',
    image: collection.image?.url || '',
    link: `/collections/${collection.handle}`,
    buttonText: 'Explore Collection',
  }));

  const fallbackSlides = products.slice(0, 5).map((product: any) => ({
    id: product.id,
    title: product.title || 'New Arrival',
    subtitle: 'Product',
    description: product.description?.substring(0, 120) || '',
    image: product.images?.edges?.[0]?.node?.url || '',
    link: `/product/${product.handle}`,
    buttonText: 'View Product',
  }));

  const slides = heroSlides.length > 0 && heroSlides[0]?.image ? heroSlides : fallbackSlides;

  return (
    <main className="bg-zinc-50">
      {/* Hero Section */}
      <Hero slides={slides} autoPlay={true} interval={5000} />

      {/* Products Section with Filters */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Handpicked just for you
            </p>
          </div>
        </div>

        {/* Products with Filtering */}
        <ProductsClient initialProducts={products} />
      </section>
    </main>
  );
}