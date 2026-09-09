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
      <div className="relative min-h-[380px] md:min-h-[450px] lg:min-h-[500px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center"
          >
            {currentSlide.image ? (
              <div className="relative w-full h-full flex items-center">
                <Image
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  fill
                  className="object-contain object-right"
                  priority
                  sizes="(max-width: 768px) 100vw, 55vw"
                  unoptimized={currentSlide.image.includes('?v=')}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
              </div>
            ) : (
              <div className="w-full h-full " />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Content - Left Side */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-sm md:max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {currentSlide.subtitle && (
                  <span className="inline-block px-4 py-1.5 mb-3 text-xs font-semibold uppercase tracking-wider bg-teal-600 text-white">
                    {currentSlide.subtitle}
                  </span>
                )}
                
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                  {currentSlide.title}
                </h1>
                
                {currentSlide.description && (
                  <p className="mt-2 text-sm md:text-base text-gray-700">
                    {currentSlide.description}
                  </p>
                )}
                
                {currentSlide.link && (
                  <Link
                    href={currentSlide.link}
                    className="inline-block mt-5 px-6 py-2.5 bg-white text-black font-medium border border-gray-300 hover:bg-gray-50 transition text-sm md:text-base"
                  >
                    {currentSlide.buttonText || 'View Product'}
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
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm text-teal-700 rounded-full hover:bg-white transition shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm text-teal-700 rounded-full hover:bg-white transition shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex ? 'w-8 h-2 bg-teal-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}