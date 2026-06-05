"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useConfig, useUpdateConfig } from '@/lib/hooks/use-config';
import { useProducts } from '@/lib/hooks/use-products';

interface FormValues {
  carousel_products: string[];
  homepage_story_title: string;
  homepage_story_description: string;
  
  about_hero_title: string;
  about_hero_description: string;
  about_heritage_title: string;
  about_heritage_desc1: string;
  about_heritage_desc2: string;

  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_hours: string;

  contact_social_instagram: string;
  contact_social_instagram_user: string;
  contact_social_tiktok: string;
  contact_social_tiktok_user: string;
}

export default function CmsSection() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useConfig();
  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const updateMutation = useUpdateConfig();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<FormValues>({
    values: config
  });

  const selectedSlugs = watch('carousel_products') || [];
  const isSubmitting = updateMutation.isPending;

  const handleCheckboxChange = (slug: string, checked: boolean) => {
    if (checked) {
      if (selectedSlugs.length >= 4) {
        return; // Prevent selection if limit reached
      }
      setValue('carousel_products', [...selectedSlugs, slug], { shouldDirty: true });
    } else {
      setValue('carousel_products', selectedSlugs.filter((s) => s !== slug), { shouldDirty: true });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await updateMutation.mutateAsync(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Échec de l'enregistrement des configurations.");
    }
  };

  if (isConfigLoading || isProductsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-10 h-10 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="rounded-xl bg-error-container/20 border border-error/20 p-md text-error flex items-center gap-sm">
        <span className="material-symbols-outlined text-2xl">error</span>
        <span>Une erreur est survenue lors du chargement des configurations: {configError.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-lg pb-xl relative">
      {/* Toast Notifications */}
      {saveSuccess && (
        <div className="fixed top-24 right-8 z-50 rounded-xl bg-primary px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in-out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Configurations enregistrées avec succès !</span>
        </div>
      )}

      {saveError && (
        <div className="fixed top-24 right-8 z-50 rounded-xl bg-error px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in-out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
        {/* Floating Save Actions */}
        <div className="sticky top-20 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md py-sm mb-md">
          <p className="text-sm text-on-surface-variant">
            {isDirty ? "⚠️ Modifications non enregistrées" : "✓ Tout est à jour"}
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="rounded-full bg-primary px-lg py-sm font-semibold text-white shadow-soft hover:bg-surface-tint disabled:opacity-50 transition-all flex items-center gap-xs"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            Enregistrer les modifications
          </button>
        </div>

        {/* SECTION 1: Carousel de l'accueil */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Carousel de l'accueil</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">
              Sélectionnez les produits qui apparaîtront sur le carousel de la page d'accueil (maximum 4). 
              <span className="font-bold text-primary ml-xs">({selectedSlugs.length} / 4 sélectionnés)</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm max-h-[300px] overflow-y-auto border border-outline-variant/20 rounded-xl p-sm">
            {products.map((product) => {
              const isChecked = selectedSlugs.includes(product.slug);
              const disabled = !isChecked && selectedSlugs.length >= 4;
              
              return (
                <label 
                  key={product.id} 
                  className={`flex items-center gap-sm border rounded-xl p-sm cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary-container/5' : 'border-outline-variant/30 hover:bg-surface-container-low'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={disabled}
                    onChange={(e) => handleCheckboxChange(product.slug, e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate text-sm">{product.title}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{product.category}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Slogan & Story de l'accueil */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Section Histoire de l'accueil</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">Modifiez le slogan principal de la page d'accueil et sa description.</p>
          </div>

          <div className="space-y-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">Slogan principal</label>
              <input
                type="text"
                {...register('homepage_story_title', { required: true })}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">Description</label>
              <textarea
                rows={3}
                {...register('homepage_story_description', { required: true })}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Page Notre Histoire */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Page Notre Histoire (About)</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">Modifiez les textes narratifs et l'histoire de la boulangerie.</p>
          </div>

          <div className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Titre d'introduction (Hero)</label>
                <input
                  type="text"
                  {...register('about_hero_title', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Description d'introduction (Hero)</label>
                <textarea
                  rows={2}
                  {...register('about_hero_description', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
                />
              </div>
            </div>

            <hr className="border-outline-variant/10" />

            <div className="space-y-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Titre de section Héritage</label>
                <input
                  type="text"
                  {...register('about_heritage_title', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-bold text-on-surface-variant">Héritage paragraphe 1</label>
                  <textarea
                    rows={4}
                    {...register('about_heritage_desc1', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-bold text-on-surface-variant">Héritage paragraphe 2</label>
                  <textarea
                    rows={4}
                    {...register('about_heritage_desc2', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Contacts & Réseaux Sociaux */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Contacts & Réseaux Sociaux</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">Ces informations mettront à jour simultanément la page Contact et le Footer.</p>
          </div>

          <div className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Numéro de Téléphone</label>
                <input
                  type="text"
                  {...register('contact_phone', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Adresse Email</label>
                <input
                  type="email"
                  {...register('contact_email', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Adresse Physique</label>
                <input
                  type="text"
                  {...register('contact_address', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Horaires d'ouverture</label>
                <input
                  type="text"
                  {...register('contact_hours', { required: true })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                />
              </div>
            </div>

            <hr className="border-outline-variant/10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Instagram */}
              <div className="space-y-xs">
                <h3 className="font-semibold text-sm text-on-surface">Instagram</h3>
                <div className="flex flex-col gap-xs">
                  <label className="text-xs text-on-surface-variant">Lien URL</label>
                  <input
                    type="text"
                    {...register('contact_social_instagram', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  />
                  <label className="text-xs text-on-surface-variant">Nom du compte</label>
                  <input
                    type="text"
                    {...register('contact_social_instagram_user', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  />
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-xs">
                <h3 className="font-semibold text-sm text-on-surface">TikTok</h3>
                <div className="flex flex-col gap-xs">
                  <label className="text-xs text-on-surface-variant">Lien URL</label>
                  <input
                    type="text"
                    {...register('contact_social_tiktok', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  />
                  <label className="text-xs text-on-surface-variant">Nom du compte</label>
                  <input
                    type="text"
                    {...register('contact_social_tiktok_user', { required: true })}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
