import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { bakeryValues } from '@/lib/site-data';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">قصتنا</p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">رحلة متجذرة في الشغف والتقاليد</h1>
          <p className="mx-auto mt-md max-w-3xl text-lg leading-8 text-on-surface-variant">بدأ الأمر في مطبخ صغير مغطى بالدقيق حيث كان الهواء دائمًا ثقيلًا برائحة الخميرة والزبدة المكرملة. نحن نؤمن بأن الفن الحقيقي يستغرق وقتًا.</p>
        </section>

        <section className="mt-xl grid gap-xl md:grid-cols-2 md:items-center">
          <div className="overflow-hidden rounded-2xl shadow-soft">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9D8JLa_bfz2-LqILaPS5Y5BNwRA_3_bfuzgyv-_AiSHUdnRMTf5_AZb6INTxhlP88O8s1X6XR4AHvNDEXK2EDRRgpY4cna0MCbdHkCPv5-jz00MwRuChHhuklDPaHhX_dCvMy5Dv9urTEaOek3gFOHeGFvTCbs0nYdUqQJqghQfUlyn25b0pdgqrw3irttdyHjTFncU2Z5NssW_4gRAVVey6EbOYqQdOcZJoP5395MAXo8JM1qL2SqWTp83OEnG2GDgZVOXJyyo"
              alt="خباز يعمل على العجين"
              className="h-[520px] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-secondary">تراث الخبز</h2>
            <p className="mt-md text-lg leading-8 text-on-surface-variant">نحن لا نخبز الخبز فقط؛ نصنع التجارب. من خلال تكريم التقنيات التي تم اختبارها عبر الزمن مع تبني المشاعر العصرية للطهي، نبتكر سلعًا مريحة ومبهجة بشكل غير متوقع.</p>
            <p className="mt-md text-base leading-8 text-on-surface-variant">تغذية العجين المخمر، تصفيح المعجنات بدقة، وتشكيل كل رغيف يدويًا هي التفاصيل التي تمنح كل قطعة شخصيتها.</p>
          </div>
        </section>

        <section className="mt-xl rounded-2xl bg-surface-container-low p-lg">
          <h2 className="text-center font-display text-4xl font-bold text-primary">مكونات لا هوادة فيها</h2>
          <div className="mt-lg grid gap-md md:grid-cols-3">
            {bakeryValues.map((value) => (
              <article key={value.title} className="rounded-2xl bg-surface-container-lowest p-lg text-center shadow-soft">
                <h3 className="font-display text-2xl font-bold text-on-surface">{value.title}</h3>
                <p className="mt-sm text-base leading-8 text-on-surface-variant">{value.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}