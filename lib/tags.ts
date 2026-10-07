import { prisma } from './prisma';

export async function ensureProductTags(productId?: string) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return;
  }

  const productsWithoutTags = await prisma.product.findMany({
    where: {
      tags: {
        none: {}
      },
      ...(productId ? { id: productId } : {})
    },
    select: {
      id: true,
      title: true,
      category: true,
    }
  });

  if (productsWithoutTags.length === 0) return;

  for (const product of productsWithoutTags) {
    const assignedTags: string[] = [];
    const title = product.title.toLowerCase();
    const category = product.category.toLowerCase();

    // Map based on keyword matching (Arabic and French/English keywords)
    if (
      title.includes('شوكولا') || 
      title.includes('chocolate') || 
      title.includes('chocolat') || 
      title.includes('كاكاو') || 
      title.includes('cocoa')
    ) {
      assignedTags.push('شوكولا');
    }
    if (
      title.includes('تارت') || 
      title.includes('tart') || 
      title.includes('كعك') || 
      title.includes('cake') || 
      title.includes('كرواسون') || 
      title.includes('croissant') || 
      title.includes('ماكرون') || 
      title.includes('macaron')
    ) {
      assignedTags.push('سكر');
    }
    if (
      title.includes('لوز') || 
      title.includes('almond') || 
      title.includes('ماكرون') || 
      title.includes('macaron')
    ) {
      assignedTags.push('لوز');
    }
    if (
      title.includes('بندق') || 
      title.includes('hazelnut')
    ) {
      assignedTags.push('بندق');
    }
    if (
      title.includes('ليمون') || 
      title.includes('lemon') || 
      title.includes('حمضيات') || 
      title.includes('citrus')
    ) {
      assignedTags.push('ليمون');
    }
    if (
      title.includes('زيت') || 
      title.includes('huile') || 
      title.includes('olive')
    ) {
      assignedTags.push('زيت');
    }
    if (
      title.includes('شخشوخة') || 
      title.includes('chakhchoukha') || 
      title.includes('لحم') || 
      title.includes('viande')
    ) {
      assignedTags.push('لحم');
    }
    if (
      title.includes('حليب') || 
      title.includes('lait') || 
      title.includes('زبدة') || 
      title.includes('butter')
    ) {
      assignedTags.push('حليب');
    }
    if (
      title.includes('سمسم') || 
      title.includes('sésame')
    ) {
      assignedTags.push('سمسم');
    }

    // Default tag if no keyword matched
    if (assignedTags.length === 0) {
      if (category.includes('traditionnel')) {
        assignedTags.push('زيت');
      } else {
        assignedTags.push('سكر');
      }
    }

    // Connect or create the tags in database
    await prisma.product.update({
      where: { id: product.id },
      data: {
        tags: {
          connectOrCreate: assignedTags.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      }
    });
  }
}
