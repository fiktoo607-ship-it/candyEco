import React from 'react';

interface AboutHistorySectionProps {
  register: any;
  watch: any;
  setValue: any;
  isAboutUploading?: boolean;
  aboutUploadError?: string | null;
  handleAboutImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AboutHistorySection({ 
  register, 
  watch, 
  setValue,
  isAboutUploading, 
  aboutUploadError, 
  handleAboutImageUpload 
}: AboutHistorySectionProps) {
  const currentImageUrl = watch ? watch('about_heritage_image') : '';

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">history_edu</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Page Notre Histoire (About)</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez les textes narratifs, l'image d'illustration et l'histoire de la boulangerie.</p>
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
          {/* SECTION IMAGE HÉRITAGE */}
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">image</span>
              Photo de la section Héritage
            </label>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
              {currentImageUrl ? (
                <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-outline-variant/40 shadow-sm flex-shrink-0 bg-surface-container-high">
                  <img
                    src={currentImageUrl}
                    alt="Aperçu Héritage"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex-1 space-y-xs w-full">
                <input type="hidden" {...register('about_heritage_image')} />
                {handleAboutImageUpload && (
                  <label className="cursor-pointer inline-flex items-center gap-xs rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-sm py-xs text-xs font-semibold whitespace-nowrap transition-all w-fit">
                    <span className={`material-symbols-outlined text-base ${isAboutUploading ? 'animate-spin' : ''}`}>
                      {isAboutUploading ? 'sync' : 'upload'}
                    </span>
                    {isAboutUploading ? 'Chargement...' : 'Téléverser'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAboutImageUpload}
                      disabled={isAboutUploading}
                      className="hidden"
                    />
                  </label>
                )}
                {aboutUploadError && (
                  <p className="text-xs text-error">{aboutUploadError}</p>
                )}
                <p className="text-xs text-on-surface-variant">
                  Format recommandé: WebP, PNG ou JPG. Conversion automatique en WebP.
                </p>
              </div>
            </div>
          </div>

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
