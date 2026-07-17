import React from 'react';

interface AboutHistorySectionProps {
  register: any;
}

export function AboutHistorySection({ register }: AboutHistorySectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">history_edu</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Page Notre Histoire (About)</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez les textes narratifs et l'histoire de la boulangerie.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">campaign</span>
              Titre d'introduction (Hero)
            </label>
            <input
              type="text"
              {...register('about_hero_title', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">short_text</span>
              Description d'introduction (Hero)
            </label>
            <textarea
              rows={2}
              {...register('about_hero_description', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
            />
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-md space-y-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">workspace_premium</span>
              Titre de section Héritage
            </label>
            <input
              type="text"
              {...register('about_heritage_title', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-base">article</span>
                Héritage paragraphe 1
              </label>
              <textarea
                rows={4}
                {...register('about_heritage_desc1', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-base">article</span>
                Héritage paragraphe 2
              </label>
              <textarea
                rows={4}
                {...register('about_heritage_desc2', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
