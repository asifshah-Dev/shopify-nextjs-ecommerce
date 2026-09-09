import { NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/data-source';

export async function GET() {
  const products = await fetchProducts();
  const handles = products.map(p => ({
    title: p.title,
    handle: p.handle,
  }));
  
  return NextResponse.json({
    totalProducts: products.length,
    handles: handles.slice(0, 10),
  });
}