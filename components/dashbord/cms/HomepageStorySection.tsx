import React from 'react';

interface HomepageStorySectionProps {
  register: any;
  watch?: any;
  setValue?: any;
  isStoryUploading?: boolean;
  storyUploadError?: string | null;
  handleStoryImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DEFAULT_STORY_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9D8JLa_bfz2-LqILaPS5Y5BNwRA_3_bfuzgyv-_AiSHUdnRMTf5_AZb6INTxhlP88O8s1X6XR4AHvNDEXK2EDRRgpY4cna0MCbdHkCPv5-jz00MwRuChHhuklDPaHhX_dCvMy5Dv9urTEaOek3gFOHeGFvTCbs0nYdUqQJqghQfUlyn25b0pdgqrw3irttdyHjTFncU2Z5NssW_4gRAVVey6EbOYqQdOcZJoP5395MAXo8JM1qL2SqWTp83OEnG2GDgZVOXJyyo";

export function HomepageStorySection({
  register,
  watch,
  isStoryUploading,
  storyUploadError,
  handleStoryImageUpload
}: HomepageStorySectionProps) {
  const currentImageUrl = watch ? watch('homepage_story_image') : '';
  const displayImageUrl = currentImageUrl || DEFAULT_STORY_IMAGE;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">auto_stories</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Section &ldquo;Notre Engagement&rdquo; (Accueil)</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez le titre, la description et l&apos;image d&apos;illustration de la section d&apos;engagement sur la page d&apos;accueil.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        {/* Photo de la section */}
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">image</span>
            Photo de la section
          </label>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
            <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden border border-outline-variant/40 shadow-sm flex-shrink-0 bg-surface-container-high">
              <img
                src={displayImageUrl}
                alt="Aperçu Notre Engagement"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-xs w-full">
              <input type="hidden" {...register('homepage_story_image')} />
              {handleStoryImageUpload && (
                <label className="cursor-pointer inline-flex items-center gap-xs rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-sm py-xs text-xs font-semibold whitespace-nowrap transition-all w-fit">
                  <span className={`material-symbols-outlined text-base ${isStoryUploading ? 'animate-spin' : ''}`}>
                    {isStoryUploading ? 'sync' : 'upload'}
                  </span>
                  {isStoryUploading ? 'Chargement...' : 'Changer la photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStoryImageUpload}
                    disabled={isStoryUploading}
                    className="hidden"
                  />
                </label>
              )}
              {storyUploadError && (
                <p className="text-xs text-error">{storyUploadError}</p>
              )}
              <p className="text-xs text-on-surface-variant">
                Format recommandé : WebP, PNG ou JPG. Conversion automatique en WebP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">title</span>
            Titre de la section
          </label>
          <input
            type="text"
            {...register('homepage_story_title', { required: true })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            placeholder="Notre Engagement"
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
            placeholder="Décrivez vos engagements ou votre savoir-faire"
          />
        </div>
      </div>
    </div>
  );
}
