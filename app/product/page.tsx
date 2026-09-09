import { fetchProducts } from '@/lib/data-source';
import ProductsClient from '@/components/ProductsClient';

export const metadata = {
  title: 'All Products',
  description: 'Browse our complete collection of premium products',
};

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">
            All Products
          </h1>
          <p className="mt-2 text-zinc-500">
            {products.length} products available
          </p>
        </div>

        <ProductsClient initialProducts={products} />
      </div>
    </main>
  );
}