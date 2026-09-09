import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tiny Soul',
  description: 'Premium kids wear from Tiny Soul Pakistan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          {children}
          <CartDrawer />
          <footer className="bg-white border-t border-teal-200/50 mt-16">
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-bold text-teal-700">Tiny Soul</h3>
                  <p className="mt-2 text-sm text-coral-600 max-w-sm">
                    Premium kids wear curated with love and care. Quality guaranteed.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-teal-700 uppercase tracking-wider">Shop</h4>
                  <ul className="mt-3 space-y-2">
                    <li><Link href="/products" className="text-sm text-coral-500 hover:text-teal-600 transition-colors">All Products</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-teal-700 uppercase tracking-wider">Support</h4>
                  <ul className="mt-3 space-y-2">
                    <li><a href="#" className="text-sm text-coral-500 hover:text-teal-600 transition-colors">Contact</a></li>
                    <li><a href="#" className="text-sm text-coral-500 hover:text-teal-600 transition-colors">FAQ</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-teal-200/50 text-center text-sm text-coral-400">
                © {new Date().getFullYear()} Tiny Soul. All rights reserved.
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}