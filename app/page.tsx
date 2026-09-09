import Link from 'next/link';
import { fetchProducts } from '@/lib/data-source';
import ProductCard from '@/components/ProductCard';
import Hero from '@/components/Hero';

export default async function Home() {
  const products = await fetchProducts();

  const heroSlides = products.slice(0, 5).map((product: any) => ({
    id: product.id,
    title: product.title || 'New Arrival',
    subtitle: 'Product',
    description: product.description?.substring(0, 120) || '',
    image: product.images?.edges?.[0]?.node?.url || '',
    link: `/product/${product.handle}`,
    buttonText: 'View Product',
  }));

  return (
    <main className="bg-zinc-50">
      <Hero slides={heroSlides} autoPlay={true} interval={5000} />

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
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-300 flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {products.slice(0, 8).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}