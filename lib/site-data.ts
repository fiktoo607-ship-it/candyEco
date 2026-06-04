export type ProductCategory = 'all' | 'pastry' | 'dessert' | 'bread' | 'cookies' | 'tart' | 'macarons' | 'cake';

export type SiteLink = {
  href: string;
  label: string;
};

export const navigationLinks: SiteLink[] = [
  { href: '/home', label: 'Accueil' },
  { href: '/our-product', label: 'Produits' },
  { href: '/about', label: 'Notre Histoire' },
  { href: '/contact', label: 'Contact' }
];

export type ProductCard = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null;
  state: 'exist' | 'outofStock' | 'commingSoun';
  publishedAt: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export function getProductFilter(category: string, slug: string): Exclude<ProductCategory, 'all'> {
  const s = slug.toLowerCase();
  if (s.includes('macaron')) return 'macarons';
  if (s.includes('tart')) return 'tart';
  
  switch (category) {
    case 'Viennoiseries':
      return 'pastry';
    case 'Gâteaux':
      return 'cake';
    case 'Biscuits':
      return 'cookies';
    case 'Boulangerie':
      return 'bread';
    case 'Pâtisseries':
      return 'tart';
    default:
      return 'cake';
  }
}

export const featuredProducts: ProductCard[] = [
  {
    title: 'Croissant Classique au Beurre',
    slug: 'classic-butter-croissant',
    category: 'Viennoiseries',
    price: '$4.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM9MTXZIGDFhWsfeGXHlc1DGQfGplTMBVAqGM3d39jcjh-1nF3Py0WfiKZJ8TjoMXOGWLyhlkf9KtCoVwiQateefhVgM-M0tTpAb7UOrq_WJmOSLig2soE-oAbMyWiCN8iGVnWER8yiKBLTiDO-_QOFZxtSjQxt4EOWoBJ5K2eDQPEzxU5u-KWOwHi4DIrys9YKTKVQgZ-9f1h8VACe4IktDhP_0XksWvWoOA7aZ-ihuPCfHSEk_UIP27K0HTaWotuWVfcaO425pg',
    description: 'Feuilleté croustillant, pur beurre de baratte, cuit chaque matin.',
    story: 'Notre croissant traditionnel demande 3 jours de préparation minutieuse. Nous utilisons un beurre de baratte français de qualité supérieure pour obtenir un feuilletage aérien d\'une légèreté et d\'un goût exceptionnels.',
    limitBay: 10,
    state: 'exist',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Tarte aux Fruits Rouges de Saison',
    slug: 'seasonal-berry-tart',
    category: 'Pâtisseries',
    price: '$6.50',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApeW-EzB4OOUFz6lk1OYoj7vxVKMPQLi2zXPe4W0bewuxreI6zF1BN4IxqBrSh2b1q8ZrDyC_6XpPU0glnjRVyxeUgB2hQ4-b7Dm8AlrGR9_pwElGQ_95DVU13kOJK7-9zWPlTy6-y0zrhYyhpB8SGmkPocxHzjSid9yy-mteDirU3Q18zSqj3L8fUaFzFWCH-n5lV9zjA1O47DmKPJA6a3qz0fWrqLHkANeEODblNagL4CdXB938uHpj9bYPlYI3Sc7019uC8w1s',
    description: 'Tarte fine et craquante aux fruits frais et crème diplomate à la vanille.',
    story: 'Cette tarte combine un fond de pâte sucrée croustillant, une crème veloutée à la vanille de Madagascar et une généreuse sélection de fruits rouges fraîchement cueillis.',
    limitBay: 5,
    state: 'exist',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Pain de Campagne au Levain Naturel',
    slug: 'artisanal-sourdough-loaf',
    category: 'Boulangerie',
    price: '$8.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYX-4KJdS1MVA9rBEnGT5Ftu8wFj69SzShhv2FQbifjWWDd677Jr71886bp3budeZQJKneZ4EmOTB9BkLD3nTTgSKAMcGdB-fluvCDNcJjQ9Q9AwVjHHtW2B-NxqpOrh6nTUpcU08DSmQhmxfzyTS-ms2RLyRn1iBIjp7WpkeJYsIfPP_1dJdL8BRtPgUOB7dudIVsxfWaU4NpnMkq4eAADqt4jyb3JY4Cr2eWSKlajKJ1ITXYaca-yhIhC6Z9GbTqbaOhHzBHN9M',
    description: 'Une croûte généreuse et une mie alvéolée à fermentation lente.',
    story: 'Façonné à partir d\'un levain sauvage nourri quotidiennement dans notre fournil. Il fermente lentement pendant 24 heures pour offrir des arômes légèrement acidulés et une conservation idéale.',
    limitBay: null,
    state: 'exist',
    publishedAt: new Date().toISOString()
  }
];

export const products: ProductCard[] = [
  {
    title: 'Gâteau Intense Chocolat de Minuit',
    slug: 'midnight-cocoa-cake',
    category: 'Gâteaux',
    price: '$45.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAU0raBiNbjngNqJOWzxMIrDlrTf922c0IjNG5pokDL054UWNmhkG3KNInLDO23ADPnhhOpb6zryI1MoBeWf3OYovAabFelspt64-e3ByXRRd9xP4IZ27hbn59vDOsr_tDA6iAqlMvvdoPkS0rLSzQ9-iCcHXnxTNwGDIE-mT0vl6rnHBcEjJlzuIuJ2w8NIbJ8ukm-mauKDisW6luWQmD0deJeWS0cI4c437iZDaCFm3Wn9g9Rxh8uDkJ7wKaHksRxpwRVmFOjqE',
    description: 'Chocolat noir intense et ganache soyeuse en couches généreuses.',
    story: 'Notre dessert phare pour tous les amateurs de cacao. Plusieurs couches de biscuit moelleux au chocolat noir séparées par une ganache fondante d\'une onctuosité incomparable.',
    limitBay: 3,
    state: 'exist',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Cookies Fleur de Sel & Pépites de Chocolat',
    slug: 'sea-salt-chocolate-chips',
    category: 'Biscuits',
    price: '$24.00 / douzaine',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEB65rxkZkbZjtn5y6kctWcwseP0PFcdRK3VIImbhLQq2fQ9F-luMRBsYhqfuBYNBtOAjbQ8fxdGlEr7CK7MuMuqGpZGw2L7lx4s_JC3xPZDyGokzDflcOOHMRpROZA5WxFLzNcUiBsv0zD19gj_gOzTKzXbiy3n3AP_9RA_A83VFFGGO3wKEIjgTT7yARcm4u4S7Pvn1wQOvp9nA7mw8RCa44EWROjD1VkMdHuyVFdl8XOYeJQbDUHfeTWIiyHFVDlQifjc2KTmo',
    description: 'Moelleux à cœur avec une touche de fleur de sel pour exalter le chocolat.',
    story: 'Des cookies croustillants sur les bords et tendres au centre, parsemés de morceaux de chocolat noir premium et de fleur de sel récoltée à la main pour équilibrer la douceur.',
    limitBay: 12,
    state: 'exist',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Tarte Citron & Fruits Rouges',
    slug: 'citrus-berry-tart',
    category: 'Pâtisseries',
    price: '$38.00',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChUeRMaR_D_eLN9LCQJGVGbf0W5iyfsjuLKnG03dYBO-6A5patrXoaIILH99mcYXirznfDde6Xl99BPsvVcxk-jBUIe5OHm1_cu5Gn8G9E61vlGBrb5WITekjmHuv6W5iMNC8i8RvH6u8qvNykMgUGbztsUwgiGGMwTVvRKLjRF7SJ7np8SRxzOt6Sb4W9geuRcT5-HL92sYB14_8fEndNYD32HSv5qmJ5j-QXDYWQqFJ82NpWp4oe82F3ECvnnhCe2BNXUuU_3rc',
    description: 'Crémeux citron acidulé et framboises fraîches de saison.',
    story: 'Un accord parfait entre l\'acidité vivifiante d\'une crème de citron jaune et la douceur fruitée de framboises fraîches disposées sur une pâte sablée cuite à blanc.',
    limitBay: 4,
    state: 'outofStock',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Coffret de Macarons Artisanaux',
    slug: 'artisanal-macarons-box',
    category: 'Pâtisseries',
    price: '$32.00 / boîte',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXoMgxvm_URWJxm1nRxPH2-5CpVzaQDnauLT5zLAK_uPFTNz_yysCsEoreKBleDKiwXpndp9M9ijo7PAkwSPlI_HWOAT2SrZmWO0JDjwUGxZsqgRHJ-prPNEh3HGm08wVgj9SzaIO2poFoEp9NdR2IyhXo7_LP6WpbGJwxJdehFIlcCNrxCnLUjyFABaSun-sIoDwS_A7VCP2ZdhaDchHW1JHC01AfPgyVDEXt3XiBph2Pc8bGdIhnWKFX4jQD5j304oAzIBfXNE',
    description: 'Pistache de Sicile, eau de rose et caramel au beurre salé dans un joli coffret.',
    story: 'Une coque croustillante à la poudre d\'amande et un cœur moelleux décliné en trois saveurs classiques très parfumées.',
    limitBay: 2,
    state: 'commingSoun',
    publishedAt: null
  }
];

export const bakeryValues = [
  {
    title: 'Céréales Biologiques',
    description: 'Nous sélectionnons nos farines auprès de meuniers locaux engagés pour la santé des sols et des saveurs authentiques.'
  },
  {
    title: 'Beurre AOP Charentes-Poitou',
    description: 'Une matière grasse d\'exception pour donner à nos viennoiseries un feuilletage riche et des saveurs intenses.'
  },
  {
    title: 'Le Temps',
    description: 'Nous laissons nos pâtes reposer et maturer lentement pour un équilibre parfait des arômes et une digestion optimale.'
  }
];

export const contactLinks = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Pinterest', href: '#' }
];