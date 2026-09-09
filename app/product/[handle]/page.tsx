import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProductByHandle } from '@/lib/data-source';

interface PageProps {
  params: {
    handle: string;
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await fetchProductByHandle(params.handle);

  if (!product) {
    notFound();
  }

  const firstVariant = product.variants?.edges?.[0]?.node;
  const price = firstVariant?.price?.amount || '0.00';
  const inStock = firstVariant?.availableForSale || false;
  const images = product.images?.edges?.map((edge: any) => edge.node) || [];

  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-zinc-900 transition-colors">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div>
            <div className="relative h-96 bg-zinc-100 rounded-xl overflow-hidden">
              {images[0] ? (
                <Image
                  src={images[0].url}
                  alt={images[0].altText || product.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  No image available
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((image: any, index: number) => (
                  <div 
                    key={index} 
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 ${
                      index === 0 ? 'border-zinc-900' : 'border-zinc-200'
                    } hover:border-zinc-400 transition-colors`}
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">{product.title}</h1>
            
            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-bold text-zinc-900">Rs {price}</span>
              {inStock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  Out of Stock
                </span>
              )}
            </div>
            
            {product.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-zinc-600">{product.description}</p>
              </div>
            )}
            
            <div className="mt-8">
              <button
                className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all ${
                  inStock 
                    ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 shadow-lg' 
                    : 'bg-zinc-400 cursor-not-allowed'
                }`}
                disabled={!inStock}
              >
                {inStock ? 'Add to Cart 🛒' : 'Out of Stock'}
              </button>
              
              <p className="text-sm text-zinc-500 text-center mt-3">
                Free shipping on orders over Rs 5000
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}