'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { fetchProductByHandle } from '@/lib/data-source';
import { useCart } from '@/context/CartContext';

interface PageProps {
  params: {
    handle: string;
  };
}

export default function ProductPage({ params }: PageProps) {
  const { handle } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductByHandle(handle);
        setProduct(data);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [handle]);

  const handleAddToCart = () => {
    if (isAdding) return;
    
    setIsAdding(true);
    
    const firstVariant = product?.variants?.edges?.[0]?.node;
    const price = firstVariant?.price?.amount || product?.price || '0';
    const image = product?.images?.edges?.[0]?.node?.url || product?.image || '';
    
    const result = addToCart({
      variantId: firstVariant?.id || product?.id || '',
      title: product?.title || '',
      handle: product?.handle || '',
      price: parseFloat(price),
      quantity: quantity,
      image: image,
    });
    
    if (!result.success) {
      setErrorMsg(result.message || 'Cannot add to cart');
      setTimeout(() => setErrorMsg(''), 3000);
    } else {
      setErrorMsg('✅ Added to cart!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
    
    setTimeout(() => setIsAdding(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const firstVariant = product.variants?.edges?.[0]?.node;
  const price = firstVariant?.price?.amount || product.price || '0.00';
  const inStock = firstVariant?.availableForSale !== undefined ? firstVariant.availableForSale : true;
  
  const allImages = product.images?.edges?.map((edge: any) => edge.node.url) || [];
  const mainImage = allImages[selectedImage] || product.image || '';

  // Calculate total price based on quantity
  const unitPrice = parseFloat(price);
  const totalPrice = unitPrice * quantity;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/product" className="hover:text-teal-600 transition-colors">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium line-clamp-1">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 md:p-8 border border-gray-100 rounded-2xl">
          {/* Product Images */}
          <div>
            <div className="relative h-96 rounded-xl overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image available
                </div>
              )}
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {allImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-teal-600' : 'border-gray-200'
                    } hover:border-teal-400`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {product.title.split('|')[0]?.trim() || product.title}
            </h1>
            
            <div className="mt-4">
              <span className="text-3xl font-bold text-teal-600">
                Rs {totalPrice.toLocaleString()}
              </span>
              {quantity > 1 && (
                <span className="text-sm text-gray-400 ml-2">
                  (Rs {unitPrice.toLocaleString()} × {quantity})
                </span>
              )}
            </div>
            
            {product.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-12 text-center font-medium text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <div className="mt-6">
              {errorMsg && (
                <div className={`text-sm text-center mb-3 ${errorMsg.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {errorMsg}
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={!inStock || isAdding}
                className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all flex items-center justify-center gap-2 ${
                  inStock && !isAdding
                    ? 'bg-teal-600 hover:bg-teal-700 shadow-lg' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {isAdding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              
              <p className="text-sm text-gray-400 text-center mt-3">
                Free shipping on orders over Rs 5000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}