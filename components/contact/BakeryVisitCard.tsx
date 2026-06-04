import { THEME_CONFIG } from '@/lib/theme';

export default function BakeryVisitCard() {
  const addressParts = THEME_CONFIG.brand.contact.address.split(', ');
  const hoursParts = THEME_CONFIG.brand.contact.hours.split(' | ');

  return (
    <div className="space-y-lg lg:col-span-5">
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-lg shadow-soft">
        <h2 className="font-display text-3xl font-bold text-on-surface">Notre Boutique</h2>
        <div className="mt-md space-y-md text-base leading-8 text-on-surface-variant">
          <div>
            <p className="font-semibold text-on-surface">Adresse</p>
            <p>
              {addressParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < addressParts.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Horaires</p>
            <p>
              {hoursParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < hoursParts.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Téléphone</p>
            <p>{THEME_CONFIG.brand.contact.phone}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-container shadow-soft">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCACgQPzLvEZ4RjCNkyLzB_KbXhroZfxgZrfJPpOpp_bD9PxRvyI7lRE3_5ULFVGMWhBMabmgifYvzjQQNAMwexj3p_39YkY-vwL_5Sg6uzH_PtuUuZlz1DeQv2Q8-IP0xjZPl-gnjaW9OCOO93ln37ZzWxfPhE_o1HRewRaSFwsYaczSfe8m4TPJQgNP7ANgxu5OG68O7u00uE_nA8vOUjY19ERVW_qEmT2hvpeRAIam1Vt2V4YG-3RHMwu1qioxbsghxUnOwZl58"
          alt="Plan d'accès"
          className="h-64 w-full object-cover"
        />
      </div>
    </div>
  );
}
