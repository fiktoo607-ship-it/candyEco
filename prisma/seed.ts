import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const initialProducts = [
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
    publishedAt: new Date()
  },
  {
    title: 'تارت التوت الموسمي',
    slug: 'seasonal-berry-tart',
    category: 'gâteau',
    price: '$6.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApeW-EzB4OOUFz6lk1OYoj7vxVKMPQLi2zXPe4W0bewuxreI6zF1BN4IxqBrSh2b1q8ZrDyC_6XpPU0glnjRVyxeUgB2hQ4-b7Dm8AlrGR9_pwElGQ_95DVU13kOJK7-9zWPlTy6-y0zrhYyhpB8SGmkPocxHzjSid9yy-mteDirU3Q18zSqj3L8fUaFzFWCH-n5lV9zjA1O47DmKPJA6a3qz0fWrqLHkANeEODblNagL4CdXB938uHpj9bYPlYI3Sc7019uC8w1s',
    description: 'تارت ناعم مع التوت الطازج وكريمة الفانيليا.',
    story: 'يجمع هذا التارت بين كريمة الكاسترد المخملية بنكهة فانيليا مدغشقر، وتشكيلة من التوت البري الطازج المنتقى بعناية فائقة.',
    limitBay: 5,
    state: 'exist',
    publishedAt: new Date()
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
    publishedAt: new Date()
  },
  {
    title: 'كعكة الكاكاو منتصف الليل',
    slug: 'midnight-cocoa-cake',
    category: 'gâteau',
    price: '$45.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    description: 'شوكولاتة داكنة وغاناش حريري بطبقات غنية.',
    story: 'كعكة الكاكاو الفاخرة التي تلبي شغف عشاق الشوكولاتة الداكنة، مغطاة بطبقات سميكة من الغاناش الغني والناعم.',
    limitBay: 3,
    state: 'exist',
    publishedAt: new Date()
  },
  {
    title: 'رقائق الشوكولاتة بملح البحر',
    slug: 'sea-salt-chocolate-chips',
    category: 'gâteau',
    price: '$24.00 / دزينة',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEB65rxkZkbZjtn5y6kctWcwseP0PFcdRK3VIImbhLQq2fQ9F-luMRBsYhqfuBYNBtOAjbQ8fxdGlEr7CK7MuMuqGpZGw2L7lx4s_JC3xPZDyGokzDflcOOHMRpROZA5WxFLzNcUiBsv0zD19gj_gOzTKzXbiy3n3AP_9RA_A83VFFGGO3wKEIjgTT7yARcm4u4S7Pvn1wQOvp9nA7mw8RCa44EWROjD1VkMdHuyVFdl8XOYeJQbDUHfeTWIiyHFVDlQifjc2KTmo',
    description: 'مراكز مطاطية ولمسة من ملح البحر لإبراز الشوكولاتة.',
    story: 'بسكويت كلاسيكي محضر بقطع الشوكولاتة الداكنة الفاخرة، رشينا عليها ملح البحر الخشن لموازنة الحلاوة وإبراز النكهة الحقيقية.',
    limitBay: 12,
    state: 'exist',
    publishedAt: new Date()
  },
  {
    title: 'تارت الحمضيات والتوت',
    slug: 'citrus-berry-tart',
    category: 'gâteau',
    price: '$38.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChUeRMaR_D_eLN9LCQJGVGbf0W5iyfsjuLKnG03dYBO-6A5patrXoaIILH99mcYXirznfDde6Xl99BPsvVcxk-jBUIe5OHm1_cu5Gn8G9E61vlGBrb5WITekjmHuv6W5iMNC8i8RvH6u8qvNykMgUGbztsUwgiGGMwTVvRKLjRF7SJ7np8SRxzOt6Sb4W9geuRcT5-HL92sYB14_8fEndNYD32HSv5qmJ5j-QXDYWQqFJ82NpWp4oe82F3ECvnnhCe2BNXUuU_3rc',
    description: 'خثارة الليمون مع توت العليق الموسمي الطازج.',
    story: 'مزيج رائع من خثارة الليمون الحامض والمنعش والتوت البري الأحمر على قاعدة تارت مقرمشة ومغذية.',
    limitBay: 4,
    state: 'outofStock',
    publishedAt: new Date()
  },
  {
    title: 'مجموعة الماكرون الحرفية',
    slug: 'artisanal-macarons-box',
    category: 'gâteau',
    price: '$32.00 / علبة',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'فستق وماء ورد وكراميل مملح في صندوق واحد.',
    story: 'علبة ماكرون فرنسي مخبوز بدقة متناهية بقشرة خارجية هشة وقلب طري غني بالنكهات الحرفية المتنوعة.',
    limitBay: 2,
    state: 'commingSoun',
    publishedAt: null
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
    publishedAt: new Date()
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
    publishedAt: new Date()
  }
];

async function main() {
  console.log('Start seeding...');
  // Clear existing products
  await prisma.product.deleteMany({});
  
  for (const p of initialProducts) {
    const product = await prisma.product.create({
      data: p
    });
    console.log(`Created product with id: ${product.id}`);
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
