'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Filter, SlidersHorizontal, LayoutGrid, Grid3x3, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  price?: string;
  image?: string | null;
  productType?: string;
  vendor?: string;
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
}

interface FilterState {
  categories: string[];
  priceRange: { min: number; max: number };
  inStockOnly: boolean;
}

interface ProductsClientProps {
  initialProducts: Product[];
  isFeatured?: boolean;
}

export default function ProductsClient({ initialProducts, isFeatured = false }: ProductsClientProps) {
  const currencySymbol = 'Rs';
  const currencyRate = 1;

  const maxPrice = useMemo(() => {
    let max = 0;
    initialProducts.forEach(p => {
      const price = parseFloat(p.variants?.edges?.[0]?.node?.price?.amount || p.price || '0');
      if (price > max) max = price;
    });
    return Math.ceil(max / 100) * 100 + 100;
  }, [initialProducts]);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: { min: 0, max: maxPrice },
    inStockOnly: false,
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [sortBy, setSortBy] = useState('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const sortRef = useRef<HTMLDivElement>(null);

  const columnsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarStyle, setSidebarStyle] = useState<React.CSSProperties>({ position: 'static' });
  const SIDEBAR_TOP_OFFSET = 96;

  useEffect(() => {
    if (!showFilters) return;

    function updateSidebarPosition() {
      if (!columnsRef.current || !sidebarRef.current) return;
      const containerRect = columnsRef.current.getBoundingClientRect();
      const sidebarHeight = sidebarRef.current.offsetHeight;

      if (containerRect.top > SIDEBAR_TOP_OFFSET) {
        setSidebarStyle({ position: 'static' });
      } else if (containerRect.bottom < SIDEBAR_TOP_OFFSET + sidebarHeight) {
        setSidebarStyle({ position: 'absolute', bottom: 0, left: 0, width: 256 });
      } else {
        setSidebarStyle({
          position: 'fixed',
          top: SIDEBAR_TOP_OFFSET,
          left: containerRect.left,
          width: 256,
        });
      }
    }

    updateSidebarPosition();
    window.addEventListener('scroll', updateSidebarPosition, { passive: true });
    window.addEventListener('resize', updateSidebarPosition);
    return () => {
      window.removeEventListener('scroll', updateSidebarPosition);
      window.removeEventListener('resize', updateSidebarPosition);
    };
  }, [showFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach(p => {
      const type = p.productType || 'Uncategorized';
      cats.add(type);
    });
    return Array.from(cats);
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...initialProducts];

    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => {
        const type = p.productType || 'Uncategorized';
        return filters.categories.includes(type);
      });
    }

    filtered = filtered.filter(p => {
      const price = parseFloat(p.variants?.edges?.[0]?.node?.price?.amount || p.price || '0');
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    if (filters.inStockOnly) {
      filtered = filtered.filter(p => p.variants?.edges?.[0]?.node?.availableForSale !== false);
    }

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => {
          const aPrice = parseFloat(a.variants?.edges?.[0]?.node?.price?.amount || a.price || '0');
          const bPrice = parseFloat(b.variants?.edges?.[0]?.node?.price?.amount || b.price || '0');
          return aPrice - bPrice;
        });
        break;
      case 'price-desc':
        filtered.sort((a, b) => {
          const aPrice = parseFloat(a.variants?.edges?.[0]?.node?.price?.amount || a.price || '0');
          const bPrice = parseFloat(b.variants?.edges?.[0]?.node?.price?.amount || b.price || '0');
          return bPrice - aPrice;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [initialProducts, filters, sortBy]);

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const applyPriceFilter = () => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min: priceMin, max: priceMax },
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: { min: 0, max: maxPrice },
      inStockOnly: false,
    });
    setPriceMin(0);
    setPriceMax(maxPrice);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < maxPrice) count++;
    if (filters.inStockOnly) count++;
    return count;
  }, [filters, maxPrice]);

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortBy);
    return option ? option.label : 'Sort';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.4,
      },
    },
  };

  return (
    <div className="relative">
      {/* Desktop: Two column layout with sticky sidebar */}
      <div className="hidden lg:flex lg:gap-8 relative" ref={columnsRef}>
        {/* Sidebar - JS-driven sticky */}
        <AnimatePresence mode="wait">
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 256 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-shrink-0 self-stretch overflow-x-hidden"
            >
              <div
                ref={sidebarRef}
                style={sidebarStyle}
                className="w-64 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 space-y-4 lg:space-y-6 no-scrollbar"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-teal-700">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-sm text-coral-500 hover:text-coral-600">
                      Clear all
                    </button>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <div className="text-sm text-teal-500 mb-4">Active filters: {activeFilterCount}</div>
                )}

                {categories.length > 0 && (
                  <FilterSection title="Categories">
                    <div className="space-y-1.5 lg:space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {categories.map(cat => {
                        const count = initialProducts.filter(p => (p.productType || 'Uncategorized') === cat).length;
                        return (
                          <label key={cat} className="flex items-center justify-between cursor-pointer py-1 group">
                            <span className="text-sm text-gray-700 group-hover:text-teal-700">{cat}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{count}</span>
                              <input
                                type="checkbox"
                                checked={filters.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}

                <FilterSection title="Price (PKR)">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Min</label>
                        <input
                          type="number"
                          value={priceMin}
                          onChange={(e) => {
                            setPriceMin(Number(e.target.value));
                            applyPriceFilter();
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors text-gray-800"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-600">Max</label>
                        <input
                          type="number"
                          value={priceMax}
                          onChange={(e) => {
                            setPriceMax(Number(e.target.value));
                            applyPriceFilter();
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors text-gray-800"
                          placeholder={maxPrice.toString()}
                        />
                      </div>
                    </div>
                  </div>
                </FilterSection>

                <div className="flex items-center justify-between py-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-800">In Stock Only</span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-teal-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="pt-4 text-sm text-gray-500 border-t border-gray-200">
                  {filteredProducts.length} products
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid - NO BACKGROUND COLOR */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium text-gray-700"
              >
                <LayoutGrid className="w-4 h-4 text-teal-500" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-teal-500" />
                  <span className="hidden xs:inline">Sort: {getSortLabel()}</span>
                  <span className="xs:hidden">{getSortLabel()}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''} text-gray-400`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                      >
                        {option.label}
                        {sortBy === option.value && (
                          <Check className="w-4 h-4 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-sm text-gray-500 hidden sm:block">
                {filteredProducts.length} products
              </span>
            </div>
          </div>

          {/* Product grid - NO BACKGROUND */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`
              grid gap-4 md:gap-6
              ${viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4' 
                : 'grid-cols-1'
              }
            `}
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-xl">
                <p className="text-gray-500">No products found</p>
                <button onClick={clearFilters} className="mt-2 text-coral-500 hover:text-coral-600 underline text-sm">
                  Clear filters
                </button>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ProductCard 
                    product={p} 
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredProducts.length}
            </span>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-teal-500" />
                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''} text-gray-400`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <Check className="w-4 h-4 text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product grid - Mobile - NO BACKGROUND */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`
            grid gap-4
            ${viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3' 
              : 'grid-cols-1'
            }
          `}
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl">
              <p className="text-gray-500">No products found</p>
              <button onClick={clearFilters} className="mt-2 text-coral-500 hover:text-coral-600 underline text-sm">
                Clear filters
              </button>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <motion.div key={p.id} variants={itemVariants}>
                <ProductCard 
                  product={p} 
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-4 pb-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <h3 className="font-bold text-lg text-teal-700">Filters</h3>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button 
                        onClick={clearFilters} 
                        className="text-sm text-coral-500 hover:text-coral-600"
                      >
                        Clear all
                      </button>
                    )}
                    <button 
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-teal-700" />
                    </button>
                  </div>
                </div>

                <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                  {categories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-teal-700">Categories</h4>
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-700">{cat}</span>
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2 text-teal-700">Price (PKR)</h4>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => {
                          setPriceMin(Number(e.target.value));
                          applyPriceFilter();
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 text-gray-800"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => {
                          setPriceMax(Number(e.target.value));
                          applyPriceFilter();
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 text-gray-800"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-800">In Stock Only</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-teal-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-teal-700">Sort By</h4>
                    <div className="space-y-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            sortBy === option.value
                              ? 'bg-teal-600 text-white'
                              : 'text-gray-700 hover:bg-teal-50'
                          }`}
                        >
                          {option.label}
                          {sortBy === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsMobileFilterOpen(false)} 
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  Apply Filters ({filteredProducts.length} products)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full py-1">
        <span className="text-sm font-medium text-teal-700">{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}