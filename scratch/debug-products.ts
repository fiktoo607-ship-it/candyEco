import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    orderBy: [
      { visibility: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 12
  });
  console.log(`Found ${products.length} products:`);
  products.forEach((p, idx) => {
    console.log(`${idx}: [${p.id}] title="${p.title}" state="${p.state}"`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
