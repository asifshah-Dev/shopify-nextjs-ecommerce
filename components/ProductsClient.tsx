'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  // PKR is the only currency
  const currencySymbol = 'Rs';
  const currencyRate = 1;

  // Find max price
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
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [loading, setLoading] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // JS-driven sticky sidebar
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach(p => {
      const type = p.productType || 'Uncategorized';
      cats.add(type);
    });
    return Array.from(cats);
  }, [initialProducts]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let filtered = [...initialProducts];

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => {
        const type = p.productType || 'Uncategorized';
        return filters.categories.includes(type);
      });
    }

    // Price filter - in PKR
    filtered = filtered.filter(p => {
      const price = parseFloat(p.variants?.edges?.[0]?.node?.price?.amount || p.price || '0');
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(p => p.variants?.edges?.[0]?.node?.availableForSale !== false);
    }

    // Sort
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

  // Lazy loading - Intersection Observer (moved AFTER filteredProducts is defined)
  useEffect(() => {
    if (filteredProducts.length <= visibleProducts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => {
            setVisibleProducts(prev => Math.min(prev + 8, filteredProducts.length));
            setLoading(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredProducts.length, visibleProducts, loading]);

  // Reset visible products when filters change
  useEffect(() => {
    setVisibleProducts(12);
  }, [filters, sortBy]);

  // Toggle category
  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  // Apply price filter
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

  // Get display products (with lazy loading)
  const displayProducts = filteredProducts.slice(0, visibleProducts);
  const hasMore = filteredProducts.length > visibleProducts;

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
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-sm text-zinc-400 hover:text-zinc-700">
                      Clear all
                    </button>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <div className="text-sm text-zinc-500">Active filters: {activeFilterCount}</div>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                  <FilterSection title="Categories">
                    <div className="space-y-1.5 lg:space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {categories.map(cat => {
                        const count = initialProducts.filter(p => (p.productType || 'Uncategorized') === cat).length;
                        return (
                          <label key={cat} className="flex items-center justify-between cursor-pointer py-1 group">
                            <span className="text-sm text-zinc-700 group-hover:text-zinc-900">{cat}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">{count}</span>
                              <input
                                type="checkbox"
                                checked={filters.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}

                {/* Price Range - in PKR */}
                <FilterSection title={`Price Range (PKR)`}>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500">Min</label>
                        <input
                          type="number"
                          value={priceMin}
                          onChange={(e) => {
                            setPriceMin(Number(e.target.value));
                            applyPriceFilter();
                          }}
                          className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
                          placeholder="Rs 0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500">Max</label>
                        <input
                          type="number"
                          value={priceMax}
                          onChange={(e) => {
                            setPriceMax(Number(e.target.value));
                            applyPriceFilter();
                          }}
                          className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-900"
                          placeholder={`Rs ${maxPrice}`}
                        />
                      </div>
                    </div>
                  </div>
                </FilterSection>

                {/* In Stock Only */}
                <div className="flex items-center justify-between py-3 border-t border-zinc-200">
                  <span className="text-sm font-medium">In Stock Only</span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="pt-4 text-sm text-zinc-500 border-t border-zinc-200">
                  {filteredProducts.length} products
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-xs md:text-sm font-medium text-zinc-700"
              >
                <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden xs:inline">Sort: {getSortLabel()}</span>
                  <span className="xs:hidden">{getSortLabel()}</span>
                  <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-1 w-48 md:w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-10">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        {option.label}
                        {sortBy === option.value && (
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-900" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-sm text-zinc-500 hidden sm:block">
                {filteredProducts.length} products
              </span>
            </div>
          </div>

          {/* Product grid with lazy loading */}
          <div className={`
            grid gap-3 md:gap-4 lg:gap-6
            ${viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4' 
              : 'grid-cols-1'
            }
          `}>
            {displayProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 md:py-20 bg-white rounded-xl">
                <p className="text-zinc-500">No products found</p>
                <button onClick={clearFilters} className="mt-4 text-zinc-900 underline text-sm md:text-base">
                  Clear filters
                </button>
              </div>
            ) : (
              displayProducts.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                >
                  <ProductCard 
                    product={p} 
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Load more trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : (
                <span className="text-sm text-zinc-400">
                  Showing {displayProducts.length} of {filteredProducts.length} products
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            {/* View Toggle Buttons */}
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-all duration-300 ease-in-out ${
                  viewMode === 'grid' 
                    ? 'bg-zinc-900 text-white scale-105' 
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-all duration-300 ease-in-out ${
                  viewMode === 'list' 
                    ? 'bg-zinc-900 text-white scale-105' 
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-zinc-900 text-white text-[10px] md:text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-sm text-zinc-500">
              {filteredProducts.length} products
            </span>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden xs:inline">Sort: {getSortLabel()}</span>
                <span className="xs:hidden">{getSortLabel()}</span>
                <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-1 w-48 md:w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-900" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product grid - Mobile with lazy loading */}
        <div className={`
          grid gap-3 md:gap-4
          ${viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3' 
            : 'grid-cols-1'
          }
        `}>
          {displayProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl">
              <p className="text-zinc-500">No products found</p>
              <button onClick={clearFilters} className="mt-4 text-zinc-900 underline text-sm">
                Clear filters
              </button>
            </div>
          ) : (
            displayProducts.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
              >
                <ProductCard 
                  product={p} 
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Load more trigger - Mobile */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                <span>Loading more...</span>
              </div>
            ) : (
              <span className="text-sm text-zinc-400">
                Showing {displayProducts.length} of {filteredProducts.length} products
              </span>
            )}
          </div>
        )}
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
                <div className="w-12 h-1 bg-zinc-300 rounded-full" />
              </div>

              <div className="px-4 pb-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button 
                        onClick={clearFilters} 
                        className="text-sm text-zinc-400 hover:text-zinc-700"
                      >
                        Clear all
                      </button>
                    )}
                    <button 
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-zinc-700" />
                    </button>
                  </div>
                </div>

                <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Categories</h4>
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center justify-between py-2 border-b border-zinc-100">
                          <span className="text-sm">{cat}</span>
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <h4 className="font-medium mb-2">Price Range (PKR)</h4>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => {
                          setPriceMin(Number(e.target.value));
                          applyPriceFilter();
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-zinc-900"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => {
                          setPriceMax(Number(e.target.value));
                          applyPriceFilter();
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-zinc-900"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* In Stock */}
                  <div className="flex items-center justify-between py-3 border-t border-zinc-200">
                    <span className="text-sm font-medium">In Stock Only</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Sort */}
                  <div>
                    <h4 className="font-medium mb-2">Sort By</h4>
                    <div className="space-y-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            sortBy === option.value
                              ? 'bg-zinc-900 text-white'
                              : 'text-zinc-700 hover:bg-zinc-50'
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
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
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
    <div className="border-b border-zinc-200 pb-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full py-2">
        <span className="font-medium text-sm">{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}