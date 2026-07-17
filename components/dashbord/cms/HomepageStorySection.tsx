import React from 'react';

interface HomepageStorySectionProps {
  register: any;
}

export function HomepageStorySection({ register }: HomepageStorySectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">auto_stories</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Section Histoire de l'accueil</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez le slogan principal de la page d'accueil et sa description.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">title</span>
            Slogan principal
          </label>
          <input
            type="text"
            {...register('homepage_story_title', { required: true })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            placeholder="Saisissez un slogan percutant"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">description</span>
            Description
          </label>
          <textarea
            rows={3}
            {...register('homepage_story_description', { required: true })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
            placeholder="Décrivez votre boutique en quelques lignes"
          />
        </div>
      </div>
    </div>
  );
}
