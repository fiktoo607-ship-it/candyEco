import React from 'react';

interface ContactSocialSectionProps {
  register: any;
}

export function ContactSocialSection({ register }: ContactSocialSectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">contact_mail</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Contacts & Réseaux Sociaux</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Ces informations mettront à jour simultanément la page Contact et le Footer.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">call</span>
              Numéro de Téléphone
            </label>
            <input
              type="text"
              {...register('contact_phone', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">mail</span>
              Adresse Email
            </label>
            <input
              type="email"
              {...register('contact_email', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">location_on</span>
              Adresse Physique
            </label>
            <input
              type="text"
              {...register('contact_address', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">schedule</span>
              Horaires d'ouverture
            </label>
            <input
              type="text"
              {...register('contact_hours', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
        </div>

        <hr className="border-outline-variant/10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md pt-xs">
          {/* Instagram Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-md space-y-md transition-all hover:bg-rose-500/[0.04]">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-2xl text-rose-500 bg-rose-500/10 p-sm rounded-xl">photo_camera</span>
              <div>
                <h3 className="font-semibold text-base text-on-surface">Instagram</h3>
                <p className="text-xs text-on-surface-variant">Lien vers le compte Instagram de la boutique</p>
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant">Lien URL</label>
              <input
                type="text"
                {...register('contact_social_instagram', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
              <label className="text-xs font-bold text-on-surface-variant">Nom d'utilisateur</label>
              <input
                type="text"
                {...register('contact_social_instagram_user', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
            </div>
          </div>

          {/* TikTok Card */}
          <div className="rounded-2xl border border-neutral-800/20 bg-neutral-800/[0.02] p-md space-y-md transition-all hover:bg-neutral-800/[0.04]">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-2xl text-on-surface bg-on-surface/10 p-sm rounded-xl">movie</span>
              <div>
                <h3 className="font-semibold text-base text-on-surface">TikTok</h3>
                <p className="text-xs text-on-surface-variant">Lien vers le compte TikTok de la boutique</p>
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant">Lien URL</label>
              <input
                type="text"
                {...register('contact_social_tiktok', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
              <label className="text-xs font-bold text-on-surface-variant">Nom d'utilisateur</label>
              <input
                type="text"
                {...register('contact_social_tiktok_user', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
