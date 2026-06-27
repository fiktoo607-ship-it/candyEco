import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const productsData = [
  {
    title: 'كرواسون الزبدة الكلاسيكي',
    slug: 'classic-butter-croissant',
    category: 'gâteau',
    price: '$4.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM9MTXZIGDFhWsfeGXHlc1DGQfGplTMBVAqGM3d39jcjh-1nF3Py0WfiKZJ8TjoMXOGWLyhlkf9KtCoVwiQateefhVgM-M0tTpAb7UOrq_WJmOSLig2soE-oAbMyWiCN8iGVnWER8yiKBLTiDO-_QOFZxtSjQxt4EOWoBJ5K2eDQPEzxU5u-KWOwHi4DIrys9YKTKVQgZ-9f1h8VACe4IktDhP_0XksWvWoOA7aZ-ihuPCfHSEk_UIP27K0HTaWotuWVfcaO425pg',
    description: 'رقيق، زبدِي، ومخبوز طازجاً كل صباح.',
    story: 'نبدأ بتحضير عجينة الكرواسون الكلاسيكية على مدار 3 أيام، حيث نستخدم زبدة فرنسية فاخرة للحصول على طبقات هشة ومقرمشة تذوب في الفم.',
    limitBay: 10,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['viennoiserie', 'beurre', 'artisanal', 'bio']
  },
  {
    title: 'Pain au Chocolat Classique',
    slug: 'chocolate-croissant',
    category: 'gâteau',
    price: '$4.80',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    description: 'Feuilletage croustillant au beurre AOP et barres de chocolat noir intense.',
    story: 'Même base feuilletée dorée que notre croissant de renom, sublimée par deux barres de chocolat premium sélectionné pour sa force en cacao.',
    limitBay: 12,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['viennoiserie', 'chocolat', 'artisanal']
  },
  {
    title: 'Tarte au Citron Meringuée',
    slug: 'lemon-meringue-tart',
    category: 'gâteau',
    price: '$32.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChUeRMaR_D_eLN9LCQJGVGbf0W5iyfsjuLKnG03dYBO-6A5patrXoaIILH99mcYXirznfDde6Xl99BPsvVcxk-jBUIe5OHm1_cu5Gn8G9E61vlGBrb5WITekjmHuv6W5iMNC8i8RvH6u8qvNykMgUGbztsUwgiGGMwTVvRKLjRF7SJ7np8SRxzOt6Sb4W9geuRcT5-HL92sYB14_8fEndNYD32HSv5qmJ5j-QXDYWQqFJ82NpWp4oe82F3ECvnnhCe2BNXUuU_3rc',
    description: 'Crème au citron de Sicile sur pâte sablée, surmontée d\'une meringue italienne dorée.',
    story: 'Le contraste parfait entre le peps acidulé du citron fraîchement pressé et la douceur aérienne d\'une meringue texturée.',
    limitBay: 3,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'citron', 'bio', 'meringue']
  },
  {
    title: 'Tartelette aux Fraises de Saison',
    slug: 'strawberry-tartlet',
    category: 'gâteau',
    price: '$6.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApeW-EzB4OOUFz6lk1OYoj7vxVKMPQLi2zXPe4W0bewuxreI6zF1BN4IxqBrSh2b1q8ZrDyC_6XpPU0glnjRVyxeUgB2hQ4-b7Dm8AlrGR9_pwElGQ_95DVU13kOJK7-9zWPlTy6-y0zrhYyhpB8SGmkPocxHzjSid9yy-mteDirU3Q18zSqj3L8fUaFzFWCH-n5lV9zjA1O47DmKPJA6a3qz0fWrqLHkANeEODblNagL4CdXB938uHpj9bYPlYI3Sc7019uC8w1s',
    description: 'Fraises fraîches sucrées sur un lit de crème pâtissière légère.',
    story: 'Préparée uniquement lors de la récolte locale de printemps pour vous garantir des fruits mûris naturellement au soleil.',
    limitBay: 8,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'fraise', 'saison', 'fruits']
  },
  {
    title: 'رغيف العجين المخمر الحرفي',
    slug: 'artisanal-sourdough-loaf',
    category: 'gâteau',
    price: '$8.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYX-4KJdS1MVA9rBEnGT5Ftu8wFj69SzShhv2FQbifjWWDd677Jr71886bp3budeZQJKneZ4EmOTB9BkLD3nTTgSKAMcGdB-fluvCDNcJjQ9Q9AwVjHHtW2B-NxqpOrh6nTUpcU08DSmQhmxfzyTS-ms2RLyRn1iBIjp7WpkeJYsIfPP_1dJdL8BRtPgUOB7dudIVsxfWaU4NpnMkq4eAADqt4jyb3JY4Cr2eWSKlajKJ1ITXYaca-yhIhC6Z9GbTqbaOhHzBHN9M',
    description: 'قشرة عميقة ونكهة مخمرة ببطء.',
    story: 'رغيف يخبز بالخميرة الطبيعية التي نغذيها يومياً منذ سنوات. مخمر ببطء لمدة 24 ساعة ليعطي القشرة المقرمشة واللب الطري ذو الطعم الحامض المميز.',
    limitBay: null,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['boulangerie', 'levain', 'traditionnel']
  },
  {
    title: 'Baguette Tradition Française',
    slug: 'french-baguette',
    category: 'gâteau',
    price: '$2.20',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYX-4KJdS1MVA9rBEnGT5Ftu8wFj69SzShhv2FQbifjWWDd677Jr71886bp3budeZQJKneZ4EmOTB9BkLD3nTTgSKAMcGdB-fluvCDNcJjQ9Q9AwVjHHtW2B-NxqpOrh6nTUpcU08DSmQhmxfzyTS-ms2RLyRn1iBIjp7WpkeJYsIfPP_1dJdL8BRtPgUOB7dudIVsxfWaU4NpnMkq4eAADqt4jyb3JY4Cr2eWSKlajKJ1ITXYaca-yhIhC6Z9GbTqbaOhHzBHN9M',
    description: 'La classique baguette française à la croûte dorée et mie alvéolée.',
    story: 'Façonnée à la main et cuite sur sole de pierre selon les standards les plus stricts de la boulangerie artisanale.',
    limitBay: 15,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['boulangerie', 'traditionnel', 'bio']
  },
  {
    title: 'Éclair au Chocolat Noir',
    slug: 'chocolate-eclair',
    category: 'gâteau',
    price: '$5.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'Pâte à choux garnie de crème pâtissière au chocolat et glacée maison.',
    story: 'Un grand classique de la pâtisserie française, garni d\'une crème onctueuse parfumée au chocolat à 70% de cacao.',
    limitBay: 6,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'chocolat', 'creme']
  },
  {
    title: 'Mille-Feuille Traditionnel',
    slug: 'classic-mille-feuille',
    category: 'gâteau',
    price: '$5.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'Pâte feuilletée caramélisée alternée avec une crème diplomate vanille.',
    story: 'Trois couches de feuilletage croustillant séparées de deux couches de crème onctueuse parfumée à la vanille bourbon.',
    limitBay: 4,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'creme', 'artisanal', 'vanille']
  },
  {
    title: 'Brioche Tressée Pur Beurre',
    slug: 'braided-brioche',
    category: 'gâteau',
    price: '$9.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM9MTXZIGDFhWsfeGXHlc1DGQfGplTMBVAqGM3d39jcjh-1nF3Py0WfiKZJ8TjoMXOGWLyhlkf9KtCoVwiQateefhVgM-M0tTpAb7UOrq_WJmOSLig2soE-oAbMyWiCN8iGVnWER8yiKBLTiDO-_QOFZxtSjQxt4EOWoBJ5K2eDQPEzxU5u-KWOwHi4DIrys9YKTKVQgZ-9f1h8VACe4IktDhP_0XksWvWoOA7aZ-ihuPCfHSEk_UIP27K0HTaWotuWVfcaO425pg',
    description: 'Brioche moelleuse tressée à la main, saupoudrée de grains de sucre.',
    story: 'Une mie filante d\'une douceur incomparable obtenue par un long pétrissage et beaucoup de patience.',
    limitBay: 5,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['viennoiserie', 'sucre', 'partage', 'moelleux']
  },
  {
    title: 'Coffret de Macarons Fins',
    slug: 'artisanal-macarons-box',
    category: 'gâteau',
    price: '$32.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'Fou de macarons ? Goûtez notre boîte de 12 pièces assorties.',
    story: 'Pistache, vanille, chocolat noir, framboise et caramel au beurre salé cuisinés artisanalement.',
    limitBay: 3,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'amande', 'cadeau', 'assortiment']
  },
  {
    title: 'Flan Pâtissier à la Vanille de Madagascar',
    slug: 'vanilla-custard-flan',
    category: 'gâteau',
    price: '$4.20',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    description: 'Une crème flan crémeuse sur une pâte brisée croustillante.',
    story: 'Infusé longuement avec des gousses de vanille de Madagascar entières pour libérer un parfum profond.',
    limitBay: 10,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'vanille', 'creme', 'traditionnel']
  },
  {
    title: 'Cookies aux Pépites de Chocolat & Sel de Guérande',
    slug: 'sea-salt-chocolate-chips',
    category: 'gâteau',
    price: '$24.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEB65rxkZkbZjtn5y6kctWcwseP0PFcdRK3VIImbhLQq2fQ9F-luMRBsYhqfuBYNBtOAjbQ8fxdGlEr7CK7MuMuqGpZGw2L7lx4s_JC3xPZDyGokzDflcOOHMRpROZA5WxFLzNcUiBsv0zD19gj_gOzTKzXbiy3n3AP_9RA_A83VFFGGO3wKEIjgTT7yARcm4u4S7Pvn1wQOvp9nA7mw8RCa44EWROjD1VkMdHuyVFdl8XOYeJQbDUHfeTWIiyHFVDlQifjc2KTmo',
    description: 'Cookies américains généreux, moelleux au cœur et croustillants sur les bords.',
    story: 'Avec de généreuses pépites de chocolat belge et un soupçon de fleur de sel de Guérande.',
    limitBay: 12,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['biscuits', 'chocolat', 'sel', 'moelleux']
  },
  {
    title: 'Madeleines Pur Beurre au Miel et Citron',
    slug: 'honey-lemon-madeleines',
    category: 'gâteau',
    price: '$18.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEB65rxkZkbZjtn5y6kctWcwseP0PFcdRK3VIImbhLQq2fQ9F-luMRBsYhqfuBYNBtOAjbQ8fxdGlEr7CK7MuMuqGpZGw2L7lx4s_JC3xPZDyGokzDflcOOHMRpROZA5WxFLzNcUiBsv0zD19gj_gOzTKzXbiy3n3AP_9RA_A83VFFGGO3wKEIjgTT7yARcm4u4S7Pvn1wQOvp9nA7mw8RCa44EWROjD1VkMdHuyVFdl8XOYeJQbDUHfeTWIiyHFVDlQifjc2KTmo',
    description: 'Boîte de 10 délicieuses madeleines artisanales avec une bosse parfaite.',
    story: 'Recette ancestrale enrichie d\'une pointe de miel de lavande et zestes de citron bio.',
    limitBay: 5,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['biscuits', 'miel', 'citron', 'beurre']
  },
  {
    title: 'Gâteau Opéra Chocolat et Café',
    slug: 'opera-cake',
    category: 'gâteau',
    price: '$45.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    description: 'Superposition fine de biscuit Joconde au café, ganache et crème au beurre.',
    story: 'Pâtisserie complexe et raffinée, décorée d\'une feuille d\'or fine pour vos grandes célébrations.',
    limitBay: 3,
    state: 'exist',
    publishedAt: new Date(),
    tags: ['patisserie', 'cafe', 'chocolat', 'or']
  },
  {
    title: "Huile d'olive Traditionnelle",
    slug: "huile-dolive-traditionnelle",
    category: "aliments traditionnel",
    price: "12.00 $",
    imageUrl: "/olive-oil.webp",
    description: "Huile d'olive extra vierge, pressée à froid, issue de nos oliviers ancestraux.",
    story: "Cette huile d'olive est produite selon des méthodes traditionnelles transmises de génération en génération, offrant un goût riche et authentique.",
    limitBay: 5,
    state: "exist",
    publishedAt: new Date(),
    tags: ['olive', 'bio', 'terroir', 'traditionnel']
  },
  {
    title: "Miel Sauvage de Lavande Bio",
    slug: "organic-lavender-honey",
    category: "aliments traditionnel",
    price: "14.50 $",
    imageUrl: "/olive-oil.webp",
    description: "Miel d'apiculture biologique récolté dans les champs de lavande sauvages.",
    story: "Non pasteurisé pour préserver tous les nutriments, minéraux et antioxydants naturels.",
    limitBay: 10,
    state: "exist",
    publishedAt: new Date(),
    tags: ['miel', 'bio', 'terroir', 'sain']
  },
  {
    title: "Chakhchoukha Traditionnelle",
    slug: "chakhchoukha-traditionnelle",
    category: "aliments traditionnel",
    price: "15.00 $",
    imageUrl: "/chakhchoukha.webp",
    description: "Plat traditionnel composé de feuilles de pâte émiettées et d'une sauce parfumée.",
    story: "Un plat traditionnel emblématique et convivial, préparé à la main pour faire revivre les saveurs d'antan.",
    limitBay: 5,
    state: "exist",
    publishedAt: new Date(),
    tags: ['plat', 'epice', 'traditionnel', 'viande']
  },
  {
    title: "Dattes d'Algérie Fourrées aux Noix",
    slug: "stuffed-dates-walnuts",
    category: "aliments traditionnel",
    price: "19.00 $",
    imageUrl: "/chakhchoukha.webp",
    description: "Dattes Deglet Nour de qualité supérieure, sélectionnées et fourrées aux noix croquantes.",
    story: "Une douceur saine et naturelle, idéale pour refaire le plein d'énergie de façon gourmande.",
    limitBay: 8,
    state: "exist",
    publishedAt: new Date(),
    tags: ['dattes', 'noix', 'sucre-naturel', 'bio']
  },
  {
    title: "Couscous Artisanal Complet",
    slug: "artisanal-couscous-whole",
    category: "aliments traditionnel",
    price: "11.00 $",
    imageUrl: "/chakhchoukha.webp",
    description: "Semoule de blé complet roulée à la main de manière artisanale.",
    story: "Riche en fibres, notre couscous conserve le germe du blé pour un goût de noisette et une digestion facilitée.",
    limitBay: 10,
    state: "exist",
    publishedAt: new Date(),
    tags: ['grain', 'bio', 'traditionnel', 'sain']
  },
  {
    title: "Confiture de Figues Sauvages",
    slug: "wild-fig-jam",
    category: "aliments traditionnel",
    price: "8.50 $",
    imageUrl: "/olive-oil.webp",
    description: "Confiture de figues cueillies à maturité dans le verger familial.",
    story: "Cuite doucement dans des chaudrons en cuivre avec peu de sucre ajouté pour laisser s'exprimer le fruit.",
    limitBay: null,
    state: "exist",
    publishedAt: new Date(),
    tags: ['fruits', 'bio', 'sucre', 'artisanal']
  }
];

async function main() {
  console.log('Start seeding...');

  // Clean DB safely
  await prisma.orderNotification.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.faq.deleteMany({});
  await prisma.carouselSlide.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Users
  const customerPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const customerUser = await prisma.user.create({
    data: {
      name: 'Jean Dupont',
      email: 'customer@candyecon.com',
      password: customerPassword,
      role: 'user',
      emailVerified: new Date()
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Eva',
      email: 'admin@candyecon.com',
      password: adminPassword,
      role: 'admin',
      emailVerified: new Date()
    }
  });

  console.log('Users seeded successfully');

  // 2. Seed Products
  const createdProducts: Record<string, any> = {};
  for (const p of productsData) {
    const { tags, ...productData } = p;
    const product = await prisma.product.create({
      data: {
        ...productData,
        tags: tags ? {
          connectOrCreate: tags.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        } : undefined
      }
    });
    createdProducts[product.slug] = product;
    console.log(`Created product: ${product.title} (${product.slug})`);
  }

  // 3. Seed CarouselSlides with real data
  await prisma.carouselSlide.createMany({
    data: [
      {
        title: 'Pains et Viennoiseries Cuits du Jour',
        description: 'Savourez la chaleur de notre fournil matinal avec des viennoiseries et pains artisanaux cuits quotidiennement.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM9MTXZIGDFhWsfeGXHlc1DGQfGplTMBVAqGM3d39jcjh-1nF3Py0WfiKZJ8TjoMXOGWLyhlkf9KtCoVwiQateefhVgM-M0tTpAb7UOrq_WJmOSLig2soE-oAbMyWiCN8iGVnWER8yiKBLTiDO-_QOFZxtSjQxt4EOWoBJ5K2eDQPEzxU5u-KWOwHi4DIrys9YKTKVQgZ-9f1h8VACe4IktDhP_0XksWvWoOA7aZ-ihuPCfHSEk_UIP27K0HTaWotuWVfcaO425pg',
        linkUrl: '/our-product',
        order: 1
      },
      {
        title: 'Produits du Terroir Authentiques',
        description: "Découvrez notre sélection exclusive d'aliments traditionnels extra-vierges et faits main.",
        imageUrl: '/olive-oil.webp',
        linkUrl: '/our-product',
        order: 2
      },
      {
        title: "Créations Pâtissières d'Exception",
        description: 'Nos gâteaux et tartes artisanaux sont confectionnés avec passion pour vos moments de partage.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApeW-EzB4OOUFz6lk1OYoj7vxVKMPQLi2zXPe4W0bewuxreI6zF1BN4IxqBrSh2b1q8ZrDyC_6XpPU0glnjRVyxeUgB2hQ4-b7Dm8AlrGR9_pwElGQ_95DVU13kOJK7-9zWPlTy6-y0zrhYyhpB8SGmkPocxHzjSid9yy-mteDirU3Q18zSqj3L8fUaFzFWCH-n5lV9zjA1O47DmKPJA6a3qz0fWrqLHkANeEODblNagL4CdXB938uHpj9bYPlYI3Sc7019uC8w1s',
        linkUrl: '/our-product',
        order: 3
      }
    ]
  });
  console.log('Carousel slides seeded');

  // 4. Seed 5 realistic Orders with different statuses
  // Order 1: PENDING (En attente) - Customer Jean Dupont
  const order1 = await prisma.order.create({
    data: {
      userId: customerUser.id,
      status: 'PENDING',
      reference: 'ORD-20260627-001',
      totalPrice: '$9.00',
      totalAmount: 9.00,
      customerName: 'Jean Dupont',
      customerPhone: '+33612345678',
      customerEmail: 'customer@candyecon.com',
      shippingAddress: '15 Rue de la Paix, Paris, 75002',
      deliveryMethod: 'Livraison Standard',
      items: {
        create: [
          {
            productId: createdProducts['classic-butter-croissant'].id,
            quantity: 2,
            priceAtPurchase: '$4.50',
            amountAtPurchase: 4.50
          }
        ]
      }
    }
  });

  // Order 2: ACCEPTED (Acceptée) - Admin Eva will see this
  const order2 = await prisma.order.create({
    data: {
      userId: null,
      status: 'ACCEPTED',
      reference: 'ORD-20260627-002',
      totalPrice: '$24.00',
      totalAmount: 24.00,
      customerName: 'Alice Martin',
      customerPhone: '+33698765432',
      customerEmail: 'alice@example.com',
      shippingAddress: '42 Avenue des Champs-Élysées, Paris, 75008',
      deliveryMethod: 'Retrait en boutique',
      items: {
        create: [
          {
            productId: createdProducts['sea-salt-chocolate-chips'].id,
            quantity: 1,
            priceAtPurchase: '$24.00',
            amountAtPurchase: 24.00
          }
        ]
      }
    }
  });

  // Order 3: DELIVERED (Livrée) - Jean Dupont ordered midnight-cocoa-cake, can rate it!
  const order3 = await prisma.order.create({
    data: {
      userId: customerUser.id,
      status: 'DELIVERED',
      reference: 'ORD-20260627-003',
      totalPrice: '$45.00',
      totalAmount: 45.00,
      customerName: 'Jean Dupont',
      customerPhone: '+33612345678',
      customerEmail: 'customer@candyecon.com',
      shippingAddress: '15 Rue de la Paix, Paris, 75002',
      deliveryMethod: 'Livraison Standard',
      items: {
        create: [
          {
            productId: createdProducts['opera-cake'].id,
            quantity: 1,
            priceAtPurchase: '$45.00',
            amountAtPurchase: 45.00
          }
        ]
      }
    }
  });

  // Order 4: CANCELLED (Annulée)
  const order4 = await prisma.order.create({
    data: {
      userId: null,
      status: 'CANCELLED',
      reference: 'ORD-20260627-004',
      totalPrice: '$8.00',
      totalAmount: 8.00,
      customerName: 'Bob Smith',
      customerPhone: '+33755555555',
      customerEmail: 'bob@example.com',
      shippingAddress: '10 High Street, London, UK',
      deliveryMethod: 'Livraison Standard',
      items: {
        create: [
          {
            productId: createdProducts['artisanal-sourdough-loaf'].id,
            quantity: 1,
            priceAtPurchase: '$8.00',
            amountAtPurchase: 8.00
          }
        ]
      }
    }
  });

  // Order 5: DELIVERED (Livrée) - Claire Dubois
  const order5 = await prisma.order.create({
    data: {
      userId: null,
      status: 'DELIVERED',
      reference: 'ORD-20260627-005',
      totalPrice: '$32.00',
      totalAmount: 32.00,
      customerName: 'Claire Dubois',
      customerPhone: '+33644444444',
      customerEmail: 'claire@example.com',
      shippingAddress: '8 Boulevard Saint-Germain, Paris, 75005',
      deliveryMethod: 'Retrait en boutique',
      items: {
        create: [
          {
            productId: createdProducts['artisanal-macarons-box'].id,
            quantity: 1,
            priceAtPurchase: '$32.00',
            amountAtPurchase: 32.00
          }
        ]
      }
    }
  });

  console.log('Orders seeded successfully');

  // 5. Seed FAQs
  const initialFaqs = [
    {
      question: "Quels sont vos horaires d'ouverture ?",
      answer: "Nous sommes ouverts du lundi au samedi de 8h00 à 20h00.",
    },
    {
      question: "Proposez-vous des options sans gluten ?",
      answer: "Oui, nous proposons une sélection de gâteaux et d'aliments traditionnels sans gluten préparés dans un espace dédié.",
    },
    {
      question: "Comment puis-je passer une commande personnalisée ?",
      answer: "Vous pouvez nous contacter directement via notre page de contact ou nous appeler pour discuter de vos besoins de personnalisation.",
    }
  ];
  for (const faq of initialFaqs) {
    await prisma.faq.create({ data: faq });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
