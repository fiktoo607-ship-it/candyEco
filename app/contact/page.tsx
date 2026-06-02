import Link from 'next/link';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { contactLinks } from '@/lib/site-data';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <section className="text-center md:text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">اتصل بنا</p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">أهلاً بك</h1>
          <p className="mx-auto mt-md max-w-3xl text-lg leading-8 text-on-surface-variant md:mx-0">سواء كان لديك استفسار حول مخبوزاتنا اليومية، أو تريد طلب شيء خاص، أو فقط تود إلقاء التحية، يسعدنا تواصلك معنا.</p>
        </section>

        <section className="mt-xl grid gap-xl lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-lg shadow-soft">
              <h2 className="font-display text-3xl font-bold text-on-surface">تواصل معنا</h2>
              <div className="mt-md space-y-sm">
                {contactLinks.map((link) => (
                  <Link key={link.label} href={link.href} className="flex items-center gap-sm rounded-xl border border-outline-variant/20 px-md py-sm text-base text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">•</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-lg lg:col-span-5">
            <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-lg shadow-soft">
              <h2 className="font-display text-3xl font-bold text-on-surface">قم بزيارة المخبز</h2>
              <div className="mt-md space-y-md text-base leading-8 text-on-surface-variant">
                <div>
                  <p className="font-semibold text-on-surface">الموقع</p>
                  <p>124 شارع بيكر<br />حي الحرفيين<br />نيويورك، NY 10001</p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">ساعات العمل</p>
                  <p>الإثنين-السبت: 7 صباحاً - 6 مساءً<br />الأحد: مغلق</p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">الهاتف</p>
                  <p>(555) 123-4567</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-surface-container shadow-soft">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCACgQPzLvEZ4RjCNkyLzB_KbXhroZfxgZrfJPpOpp_bD9PxRvyI7lRE3_5ULFVGMWhBMabmgifYvzjQQNAMwexj3p_39YkY-vwL_5Sg6uzH_PtuUuZlz1DeQv2Q8-IP0xjZPl-gnjaW9OCOO93ln37ZzWxfPhE_o1HRewRaSFwsYaczSfe8m4TPJQgNP7ANgxu5OG68O7u00uE_nA8vOUjY19ERVW_qEmT2hvpeRAIam1Vt2V4YG-3RHMwu1qioxbsghxUnOwZl58"
                alt="خريطة"
                className="h-64 w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}