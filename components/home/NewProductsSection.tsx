"use client";

import ProductCard from "../ProductCard";
import dictionary from "@/lib/copy-dictionary.json";

interface Product {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  state: string;
  limitBay?: number | null;
  tags?: string[];
}

interface NewProductsSectionProps {
  products: Product[];
}

export default function NewProductsSection({ products }: NewProductsSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-container-max px-gutter py-md space-y-md">
      {/* Title Header */}
      <div className="text-center flex flex-col items-center justify-center">
        <h2 className="font-display text-4xl font-bold text-on-surface">
          {dictionary.home.newProducts?.title || "Nouveautés"}
        </h2>
        <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
      </div>

      {/* Responsive Slider/Grid Layout */}
      <div className="flex gap-md overflow-x-auto pb-sm snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-x-visible md:pb-0">
        {products.map((product) => (
          <div
            key={product.id || product.slug}
            className="w-[85vw] flex-shrink-0 snap-start sm:w-[45vw] md:w-auto md:flex-shrink"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
