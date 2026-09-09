'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import currency from 'currency.js';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    description?: string;
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
  };
  currencySymbol?: string;
  currencyRate?: number;
}

export default function ProductCard({ product, currencySymbol = '$', currencyRate = 1 }: ProductCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { addToCart } = useCart();
  
  const image = product.images.edges[0]?.node;
  const variant = product.variants.edges[0]?.node;
  const price = variant?.price?.amount || '0.00';
  const isAvailable = variant?.availableForSale || false;
  const quantityAvailable = variant?.quantityAvailable || 0;

  const formattedPrice = () => {
    const num = parseFloat(price);
    const converted = num * currencyRate;
    return currency(converted, { symbol: currencySymbol, precision: 0 }).format();
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAvailable || isAdding) return;
    
    // Check stock
    if (quantityAvailable <= 0) {
      setErrorMsg('Out of stock!');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }
    
    setIsAdding(true);
    
    const result = addToCart({
      variantId: variant?.id || product.id,
      title: product.title,
      handle: product.handle,
      price: parseFloat(price) * currencyRate,
      quantity: 1,
      image: image?.url,
      maxQuantity: quantityAvailable,
    });
    
    if (!result.success) {
      setErrorMsg(result.message || 'Cannot add to cart');
      setTimeout(() => setErrorMsg(''), 2000);
    }
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const isOutOfStock = !isAvailable || quantityAvailable <= 0;

  return (
    <Link
      href={`/product/${product.handle}`}
      className="group relative block transition-all duration-300 ease-in-out hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-xl bg-zinc-100">
        <div className="aspect-[3/4] relative">
          {image ? (
            <>
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse" />
              )}
              
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`
                  object-cover transition-all duration-700 ease-in-out
                  group-hover:scale-105
                  ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setIsImageLoaded(true)}
                priority={false}
                quality={85}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
              <svg
                className="w-12 h-12 text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {!isOutOfStock && quantityAvailable <= 5 && quantityAvailable > 0 && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium tracking-wide text-white">
              Only {quantityAvailable} left
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className="font-medium text-zinc-800 leading-tight group-hover:text-zinc-600 transition-colors duration-300">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 tracking-tight">
            {formattedPrice()}
          </span>
          
          {!isOutOfStock && (
            <span className="text-xs font-medium tracking-wide text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              In Stock
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mt-1 text-xs text-red-500 font-medium">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`w-full mt-2 py-2 text-sm font-medium rounded-lg transition-all ${
            !isOutOfStock && !isAdding
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {isAdding ? 'Adding...' : 
           isOutOfStock ? 'Out of Stock' : 
           'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}