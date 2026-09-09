// components/Hero.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
}

interface HeroProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
}

export default function Hero({ slides = [], autoPlay = true, interval = 5000 }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!autoPlay || isHovering || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isHovering, interval, slides.length]);

  const goToSlide = (index: number) => setCurrentIndex(index);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full bg-white overflow-hidden">
      <div className="relative h-[400px] md:h-[500px] lg:h-[550px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {currentSlide.image ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                    unoptimized={currentSlide.image.includes('?v=')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-zinc-100" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 md:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-lg text-white"
              >
                {currentSlide.subtitle && (
                  <span className="inline-block px-3 py-1 mb-2 text-xs font-medium uppercase tracking-wider bg-white/20 backdrop-blur-sm rounded-full">
                    {currentSlide.subtitle}
                  </span>
                )}
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {currentSlide.title}
                </h1>
                
                {currentSlide.description && (
                  <p className="mt-2 text-sm md:text-base text-white/90">
                    {currentSlide.description}
                  </p>
                )}
                
                {currentSlide.link && (
                  <Link
                    href={currentSlide.link}
                    className="inline-block mt-4 px-6 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition text-sm md:text-base shadow-lg"
                  >
                    {currentSlide.buttonText || 'Shop Now'}
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/50 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/50 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}