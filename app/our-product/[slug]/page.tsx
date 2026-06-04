import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import ProductDetails from '@/components/product-details/ProductDetails';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  if (!product) {
    return {
      title: 'المنتج غير موجود | Candy Eco',
      description: 'عذراً، لم يتم العثور على المنتج المطلوب.',
    };
  }

  return {
    title: `${product.title} | Candy Eco`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  if (!product) {
    notFound();
  }

  // Convert Date fields to string so it is serializable to client component
  const serializableProduct = {
    ...product,
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl w-full">
        <ProductDetails product={serializableProduct} />
      </main>
      <SiteFooter />
    </div>
  );
}
