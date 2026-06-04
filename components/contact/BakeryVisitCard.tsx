export default function BakeryVisitCard() {
  return (
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
  );
}
