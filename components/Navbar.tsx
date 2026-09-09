'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Search, User, ShoppingBag, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State for search bar
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Get cart from context
  const { cartCount, toggleCart } = useCart();
  // State for dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [isSearchOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Close menu when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isSearchOpen]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Menu variants for smooth animation
  const menuVariants = {
    hidden: {
      opacity: 0,
      x: -80,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      x: -80,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Backdrop variants for smooth fade
  const backdropVariants = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Search variants for smooth animation
  const searchVariants = {
    hidden: {
      opacity: 0,
      y: -30,
      scale: 0.95,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.95,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Menu items stagger animation
  const menuItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: (i: number) => ({
      opacity: 0,
      x: -20,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  // Menu items without labels
  const menuItems = [
    { 
      href: '/', 
      label: 'Home'
    },
    { 
      href: '/products/new-arrivals', 
      label: 'New Arrivals'
    },
    { 
      href: '/products/best-sellers', 
      label: 'Best Sellers'
    },
    { 
      href: '/products/sale', 
      label: 'Sale'
    },
    { 
      href: '/products', 
      label: 'All Products'
    },
    { 
      href: '/about', 
      label: 'About Us'
    },
    { 
      href: '/contact', 
      label: 'Contact'
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* LEFT: Menu + Search Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Menu Button */}
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <motion.div
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <X className="w-7 h-7 md:w-8 md:h-8 text-zinc-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Menu className="w-7 h-7 md:w-8 md:h-8 text-zinc-700" />
                  </motion.div>
                )}
              </button>

              {/* Search Button */}
              <button
                ref={searchButtonRef}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-7 h-7 md:w-8 md:h-8 text-zinc-700" />
              </button>
            </div>

            {/* CENTER: Store Name */}
            <Link 
              href="/" 
              className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors absolute left-1/2 -translate-x-1/2"
            >
              STORE
            </Link>

            {/* RIGHT: Account + Cart */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Account Button */}
              <Link
                href="/login"
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Account"
              >
                <User className="w-7 h-7 md:w-8 md:h-8 text-zinc-700" />
              </Link>

              {/* Cart Button with Cart Count */}
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-zinc-700" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 15
                    }}
                    className="absolute -top-0.5 -right-0.5 bg-zinc-900 text-white text-xs md:text-sm font-medium rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU - Super Smooth */}
      <AnimatePresence mode="wait">
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 z-50 h-full w-80 md:w-96 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200">
                <span className="text-xl md:text-2xl font-bold text-zinc-900">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X className="w-7 h-7 text-zinc-700" />
                  </motion.div>
                </button>
              </div>
              
              <nav className="p-4 md:p-6 overflow-y-auto h-[calc(100%-80px)]">
                <ul className="space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.li
                      key={item.href}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={index}
                    >
                      <Link
                        href={item.href}
                        className="block px-4 py-3 text-lg md:text-xl rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SEARCH BAR - Super Smooth with Click Outside */}
      <AnimatePresence mode="wait">
        {isSearchOpen && (
          <motion.div
            ref={searchContainerRef}
            variants={searchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 md:py-6">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <Search className="w-7 h-7" />
                </motion.button>
                <motion.input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex-1 py-3 text-lg md:text-xl text-zinc-900 placeholder:text-zinc-400 outline-none bg-transparent"
                />
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X className="w-7 h-7" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}