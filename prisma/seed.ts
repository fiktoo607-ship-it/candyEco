import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const initialProducts = [
  {
    name: 'كرواسون الزبدة الكلاسيكي',
    category: 'معجنات',
    price: '$4.50',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM9MTXZIGDFhWsfeGXHlc1DGQfGplTMBVAqGM3d39jcjh-1nF3Py0WfiKZJ8TjoMXOGWLyhlkf9KtCoVwiQateefhVgM-M0tTpAb7UOrq_WJmOSLig2soE-oAbMyWiCN8iGVnWER8yiKBLTiDO-_QOFZxtSjQxt4EOWoBJ5K2eDQPEzxU5u-KWOwHi4DIrys9YKTKVQgZ-9f1h8VACe4IktDhP_0XksWvWoOA7aZ-ihuPCfHSEk_UIP27K0HTaWotuWVfcaO425pg',
    badge: 'الأكثر مبيعاً',
    description: 'رقيق، زبدِي، ومخبوز طازجاً كل صباح.',
    filter: 'pastry'
  },
  {
    name: 'تارت التوت الموسمي',
    category: 'حلويات',
    price: '$6.50',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApeW-EzB4OOUFz6lk1OYoj7vxVKMPQLi2zXPe4W0bewuxreI6zF1BN4IxqBrSh2b1q8ZrDyC_6XpPU0glnjRVyxeUgB2hQ4-b7Dm8AlrGR9_pwElGQ_95DVU13kOJK7-9zWPlTy6-y0zrhYyhpB8SGmkPocxHzjSid9yy-mteDirU3Q18zSqj3L8fUaFzFWCH-n5lV9zjA1O47DmKPJA6a3qz0fWrqLHkANeEODblNagL4CdXB938uHpj9bYPlYI3Sc7019uC8w1s',
    badge: 'خالي من الجلوتين',
    description: 'تارت ناعم مع التوت الطازج وكريمة الفانيليا.',
    filter: 'tart'
  },
  {
    name: 'رغيف العجين المخمر الحرفي',
    category: 'مخبوزات',
    price: '$8.00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYX-4KJdS1MVA9rBEnGT5Ftu8wFj69SzShhv2FQbifjWWDd677Jr71886bp3budeZQJKneZ4EmOTB9BkLD3nTTgSKAMcGdB-fluvCDNcJjQ9Q9AwVjHHtW2B-NxqpOrh6nTUpcU08DSmQhmxfzyTS-ms2RLyRn1iBIjp7WpkeJYsIfPP_1dJdL8BRtPgUOB7dudIVsxfWaU4NpnMkq4eAADqt4jyb3JY4Cr2eWSKlajKJ1ITXYaca-yhIhC6Z9GbTqbaOhHzBHN9M',
    description: 'قشرة عميقة ونكهة مخمرة ببطء.',
    filter: 'bread'
  },
  {
    name: 'كعكة الكاكاو منتصف الليل',
    category: 'كعك',
    price: '$45.00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    badge: 'الأكثر مبيعاً',
    description: 'شوكولاتة داكنة وغاناش حريري بطبقات غنية.',
    filter: 'cake'
  },
  {
    name: 'رقائق الشوكولاتة بملح البحر',
    category: 'بسكويت',
    price: '$24.00 / دزينة',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEB65rxkZkbZjtn5y6kctWcwseP0PFcdRK3VIImbhLQq2fQ9F-luMRBsYhqfuBYNBtOAjbQ8fxdGlEr7CK7MuMuqGpZGw2L7lx4s_JC3xPZDyGokzDflcOOHMRpROZA5WxFLzNcUiBsv0zD19gj_gOzTKzXbiy3n3AP_9RA_A83VFFGGO3wKEIjgTT7yARcm4u4S7Pvn1wQOvp9nA7mw8RCa44EWROjD1VkMdHuyVFdl8XOYeJQbDUHfeTWIiyHFVDlQifjc2KTmo',
    description: 'مراكز مطاطية ولمسة من ملح البحر لإبراز الشوكولاتة.',
    filter: 'cookies'
  },
  {
    name: 'تارت الحمضيات والتوت',
    category: 'حلويات',
    price: '$38.00',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChUeRMaR_D_eLN9LCQJGVGbf0W5iyfsjuLKnG03dYBO-6A5patrXoaIILH99mcYXirznfDde6Xl99BPsvVcxk-jBUIe5OHm1_cu5Gn8G9E61vlGBrb5WITekjmHuv6W5iMNC8i8RvH6u8qvNykMgUGbztsUwgiGGMwTVvRKLjRF7SJ7np8SRxzOt6Sb4W9geuRcT5-HL92sYB14_8fEndNYD32HSv5qmJ5j-QXDYWQqFJ82NpWp4oe82F3ECvnnhCe2BNXUuU_3rc',
    badge: 'موسمي',
    description: 'خثارة الليمون مع توت العليق الموسمي الطازج.',
    filter: 'tart'
  },
  {
    name: 'مجموعة الماكرون الحرفية',
    category: 'حلويات',
    price: '$32.00 / علبة',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'فستق وماء ورد وكراميل مملح في صندوق واحد.',
    filter: 'macarons'
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
