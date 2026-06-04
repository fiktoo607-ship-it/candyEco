import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { uploadImage } from '../lib/cloudinary';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const candyDetails = [
  {
    title: 'حلوى الجيلي الفوارة',
    slug: 'fizzy-sour-gelly',
    category: 'جيلي',
    price: '$3.50',
    description: 'حلوى جيلي حامضة ومنعشة مغطاة بطبقة من السكر الفوار.',
    story: 'تم تحضير هذه الحلوى من عصائر الفواكه الطبيعية 100% لإعطاء نكهة منعشة وحيوية تدوم طويلاً.',
    limitBay: 15,
    state: 'exist',
    visibility: 8
  },
  {
    title: 'حبات الفراولة الهلامية',
    slug: 'strawberry-gummy-drops',
    category: 'جيلي',
    price: '$4.00',
    description: 'حلوى هلامية غنية بنكهة الفراولة الطازجة واللذيذة.',
    story: 'نستخدم مستخلص الفراولة العضوية لصنع هذه الحبات الفريدة التي تمنحك شعوراً بالبهجة في كل قمة.',
    limitBay: 12,
    state: 'exist',
    visibility: 9
  },
  {
    title: 'أصابع عرق السوس المحشوة',
    slug: 'stuffed-liquorice-pencils',
    category: 'حلوى كلاسيكية',
    price: '$4.50',
    description: 'أصابع عرق السوس اللذيذة محشوة بكريمة الفواكه الغنية.',
    story: 'وصفة تقليدية تم تطويرها بمكونات صديقة للبيئة للحفاظ على النكهة الأصيلة والقديمة لعشاق عرق السوس.',
    limitBay: 8,
    state: 'exist',
    visibility: 6
  },
  {
    title: 'حلوى الدببة المطاطية العضوية',
    slug: 'organic-gummy-bears',
    category: 'مطاطية',
    price: '$5.00',
    description: 'أشهر حلوى مطاطية بشكل دببة بنكهات مشكلة لذيذة.',
    story: 'صُنعت هذه الدببة اللطيفة بدون أي ملونات اصطناعية أو مواد حافظة، مما يجعلها الخيار المثالي والصحي للأطفال والكبار.',
    limitBay: 20,
    state: 'exist',
    visibility: 10
  },
  {
    title: 'مصاصات الكرز الطبيعية',
    slug: 'cherry-natural-lollipops',
    category: 'مصاصات',
    price: '$2.00',
    description: 'مصاصة بنكهة الكرز البري المركزة ومحلاة ببدائل السكر الطبيعية.',
    story: 'عصا خشبية قابلة للتحلل وحلوى مصنوعة ببطء للحفاظ على شكلها ومذاقها الطبيعي الرائع.',
    limitBay: null,
    state: 'exist',
    visibility: 5
  },
  {
    title: 'كرات الكراميل المملح الناعمة',
    slug: 'salted-caramel-soft-balls',
    category: 'كراميل',
    price: '$6.00',
    description: 'كرات غنية من الكراميل الكثيف مع رشة من ملح البحر الفاخر.',
    story: 'كراميل مطبوخ ببطء مع حليب بقري طازج وزبدة طبيعية، ممزوج بملح بحر عضوي لخلق توازن مثالي بين الحلاوة والملوحة.',
    limitBay: 10,
    state: 'exist',
    visibility: 8
  },
  {
    title: 'قطع المارشميلو بنكهة الفانيليا',
    slug: 'vanilla-marshmallow-clouds',
    category: 'مارشميلو',
    price: '$3.80',
    description: 'قطع مارشميلو هشة وناعمة تذوب في الفم بنكهة الفانيليا الطبيعية.',
    story: 'خفيفة للغاية كالغيوم، صُنعت بعناية لتكون الرفيق المثالي لكوب الشوكولاتة الساخنة أو للشواء في الرحلات.',
    limitBay: 15,
    state: 'exist',
    visibility: 7
  },
  {
    title: 'حلوى غزل البنات الوردية',
    slug: 'pink-cotton-candy',
    category: 'حلويات موسمية',
    price: '$3.00',
    description: 'خيوط قطنية حلوة وناعمة تذوب فور ملامستها للفم.',
    story: 'نكهة الفراولة الكلاسيكية التي تأخذك في رحلة إلى ذكريات الطفولة والمهرجانات الجميلة.',
    limitBay: 5,
    state: 'exist',
    visibility: 4
  },
  {
    title: 'أقراص النعناع المنعشة',
    slug: 'refreshing-peppermints',
    category: 'حلويات صلبة',
    price: '$2.50',
    description: 'أقراص صلبة بنكهة النعناع الفلفلي القوي لإنعاش فوري.',
    story: 'مصنوعة من زيت النعناع الطبيعي المقطر لتمنحك نفساً منعشاً وشعوراً بالبرودة طوال اليوم.',
    limitBay: null,
    state: 'exist',
    visibility: 5
  },
  {
    title: 'حلوى التوت المشكل المقرمشة',
    slug: 'crunchy-berry-mix',
    category: 'حلويات مقرمشة',
    price: '$4.20',
    description: 'حلوى صلبة من الخارج بنكهة التوت البري ومقرمشة من الداخل.',
    story: 'مزيج فريد من القرمشة الخارجية والحشو اللذيذ الذي ينفجر بنكهات التوت الأسود والأزرق والأحمر.',
    limitBay: 10,
    state: 'outofStock',
    visibility: 9
  },
  {
    title: 'قوالب الشوكولاتة بالحليب العضوي',
    slug: 'organic-milk-chocolate',
    category: 'شوكولاتة',
    price: '$7.50',
    description: 'شوكولاتة بالحليب غنية وناعمة مصنوعة من حبوب الكاكاو المستدامة.',
    story: 'ندعم مزارعي الكاكاو المحليين من خلال شراء حبوب الكاكاو العضوية لإنتاج شوكولاتة فاخرة ذات طعم غني وفريد.',
    limitBay: 6,
    state: 'exist',
    visibility: 8
  },
  {
    title: 'حلوى الفواكه الاستوائية المشكلة',
    slug: 'tropical-fruits-jelly',
    category: 'جيلي',
    price: '$4.80',
    description: 'مزيج رائع من نكهات المانجو والأناناس والباشن فروت.',
    story: 'طعم الصيف المنعش في كل قطعة، محضر بالكامل من فواكه استوائية طبيعية ناضجة تحت أشعة الشمس.',
    limitBay: 12,
    state: 'commingSoun',
    visibility: 3
  }
];

async function runImport() {
  console.log('🧹 Clearing all products from database...');
  const deleteRes = await prisma.product.deleteMany({});
  console.log(`✅ Deleted ${deleteRes.count} products from database.`);

  const candiesDir = 'c:\\Users\\InfoBulles\\Desktop\\candyEco\\candy_client\\candy_items\\candies';

  for (let i = 1; i <= 12; i++) {
    const filename = `${i}.jpeg`;
    const filepath = path.join(candiesDir, filename);

    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️ Warning: Image file not found: ${filepath}, skipping.`);
      continue;
    }

    console.log(`\n📤 Uploading ${filename} to Cloudinary...`);
    const fileBuffer = fs.readFileSync(filepath);

    try {
      const uploadResult = await uploadImage(fileBuffer, 'candies');
      console.log(`✅ Uploaded successfully. URL: ${uploadResult.url}`);

      const details = candyDetails[i - 1];
      const newProduct = await prisma.product.create({
        data: {
          title: details.title,
          slug: details.slug,
          category: details.category,
          price: details.price,
          imageUrl: uploadResult.url,
          description: details.description,
          story: details.story,
          limitBay: details.limitBay,
          state: details.state,
          visibility: details.visibility,
          publishedAt: new Date()
        }
      });

      console.log(`🎉 Created product: "${newProduct.title}" (ID: ${newProduct.id})`);
    } catch (err) {
      console.error(`❌ Failed to import candy ${filename}:`, err);
    }
  }

  console.log('\n🌟 Import process finished!');
}

runImport()
  .catch((e) => {
    console.error('Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
