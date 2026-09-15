'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
  variantId?: string;
  title: string;
  handle: string;
  price: number;
  image?: string;
  available: boolean;
  maxQuantity?: number;
  selectedOptions?: Array<{ name: string; value: string }>;
}

export default function AddToCartButton({
  variantId,
  title,
  handle,
  price,
  image,
  available,
  maxQuantity,
  selectedOptions,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [message, setMessage] = useState('');

  const handleAddToCart = () => {
    if (!available || !variantId) return;

    const result = addToCart({
      variantId,
      title,
      handle,
      price,
      quantity: 1,
      image,
      maxQuantity,
      selectedOptions,
    });

    if (!result.success) {
      setMessage(result.message || 'Unable to add this item.');
      window.setTimeout(() => setMessage(''), 2500);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleAddToCart}
        className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all transform hover:scale-[1.02] ${
          available && variantId
            ? 'bg-linear-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 shadow-lg'
            : 'bg-zinc-400 cursor-not-allowed'
        }`}
        disabled={!available || !variantId}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {available ? 'Add to Cart' : 'Out of Stock'}
        </span>
      </button>
      {message && <p className="text-sm text-red-600 text-center mt-2">{message}</p>}
    </div>
  );
}