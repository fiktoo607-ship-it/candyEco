import 'dotenv/config';
import { prisma } from '../lib/prisma';

const sampleBlogs = [
  {
    title: 'Les secrets du levain naturel',
    slug: 'les-secrets-du-levain-naturel',
    summary: 'Découvrez comment démarrer et entretenir un levain naturel pour des pains savoureux et digestes.',
    content: `<p>Le levain naturel est une fermentation vivante composée de farine et d'eau. Utilisé depuis des millénaires, il transforme les arômes de la pâte et apporte une belle acidité subtile.</p><p>Pour commencer, mélangez à parts égales de la farine biologique de seigle et de l'eau tiède. Laissez reposer à température ambiante pendant 24 heures et rafraîchissez quotidiennement avec amour et patience.</p>`,
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    category: 'Recettes',
    readingTime: 3,
    isPublished: true,
    publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
  },
  {
    title: 'Pourquoi choisir des farines biologiques locales ?',
    slug: 'pourquoi-choisir-des-farines-biologiques-locales',
    summary: 'L\'importance des céréales anciennes et du circuit court dans notre démarche artisanale.',
    content: `<p>Chez Délices d'Eva, chaque sac de farine provient de moulins partenaires respectant l'agriculture biologique. Les moutures sur meule de pierre préservent le germe de blé et ses précieux minéraux.</p><p>En privilégiant les variétés anciennes, nous favorisons la biodiversité tout en garantissant une digestibilité incomparable à nos créations.</p>`,
    coverImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80',
    category: 'Ingrédients Bio',
    readingTime: 4,
    isPublished: true,
    publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
  },
  {
    title: 'Dans les coulisses de notre atelier gourmand',
    slug: 'dans-les-coulisses-de-notre-atelier-gourmand',
    summary: 'Plongez dans l\'ambiance chaleureuse de nos fournées matinales et le travail du feu.',
    content: `<p>Dès 4 heures du matin, la boulangerie s'éveille dans un doux parfum de pain chaud et de beurre noisette. Nos artisans boulangers pétrissent avec passion chaque pâte à la main.</p><p>Le façonnage minutieux et la cuisson sur sole réfractaire donnent à chaque viennoiserie sa dorure craquante et son cœur moelleux.</p>`,
    coverImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
    category: 'Coulisses',
    readingTime: 3,
    isPublished: true,
    publishedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
  },
  {
    title: 'Nouveau : Nos créations pâtissières de saison',
    slug: 'nouveau-nos-creations-patissieres-de-saison',
    summary: 'Découvrez notre collection de tartelettes aux fruits du verger et ganaches végétales.',
    content: `<p>Le printemps arrive avec de nouvelles saveurs fruitées et légères ! Nous avons conçu une sélection exclusive de tartelettes acidulées, de crèmes onctueuses et de douceurs allégées en sucre.</p><p>Disponibles dès aujourd'hui en boutique et en commande en ligne. Venez les déguster !</p>`,
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
    category: 'Actualités',
    readingTime: 2,
    isPublished: true,
    publishedAt: new Date(),
  },
];

async function main() {
  console.log('Seeding 4 small test blog posts...');

  for (const blog of sampleBlogs) {
    const post = await prisma.blogPost.upsert({
      where: { slug: blog.slug },
      update: {
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        coverImage: blog.coverImage,
        category: blog.category,
        readingTime: blog.readingTime,
        isPublished: blog.isPublished,
        publishedAt: blog.publishedAt,
      },
      create: blog,
    });
    console.log(`✓ Upserted blog post: "${post.title}" (${post.slug})`);
  }

  console.log('Successfully seeded 4 test blog posts.');
}

main()
  .catch((e) => {
    console.error('Error seeding blogs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
