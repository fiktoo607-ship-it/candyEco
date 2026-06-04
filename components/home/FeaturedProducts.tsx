import ProductCard from '../ProductCard';

interface FeaturedProduct {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  state: string;
}

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="mx-auto max-w-container-max px-gutter py-xl">
      <div className="mb-lg text-center">
        <h2 className="font-display text-4xl font-bold text-on-surface">حلويات مميزة</h2>
        <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
      </div>

      <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.title} product={product} />
        ))}
      </div>
    </section>
  );
}
