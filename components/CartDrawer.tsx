'use client';

import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    cartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    closeCart,
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-zinc-700" />
                <h2 className="text-lg font-bold text-zinc-900">Your Cart</h2>
                <span className="text-sm text-zinc-500">({cartCount})</span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-700" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-zinc-300 mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-800">Your cart is empty</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Looks like you haven't added any items yet.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-4 border-b border-zinc-100"
                  >
                    {/* Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-zinc-100 rounded-lg overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-400">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.handle}`}
                        className="font-medium text-zinc-800 hover:text-zinc-600 transition-colors line-clamp-1"
                        onClick={closeCart}
                      >
                        {item.title}
                      </Link>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {item.selectedOptions.map((opt, i) => (
                            <span key={i}>
                              {opt.name}: {opt.value}
                              {i < item.selectedOptions.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-zinc-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 text-zinc-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-zinc-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 text-zinc-600" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 ml-1 rounded-lg hover:bg-red-50 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-zinc-200 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-semibold text-zinc-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Shipping</span>
                    <span className="text-zinc-500">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-200">
                  <span>Total</span>
                  <span className="text-zinc-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCart}
                    className="flex-1 px-6 py-3 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      // Redirect to checkout
                      // window.location.href = '/checkout';
                    }}
                    className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Checkout
                  </button>
                </div>

                <button
                  onClick={clearCart}
                  className="w-full text-sm text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}