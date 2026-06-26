"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useConfig, useUpdateConfig } from '@/lib/hooks/use-config';
import { useProducts, useUploadImage } from '@/lib/hooks/use-products';
import { convertToWebP } from '@/lib/image-utils';
import { 
  useCarouselSlides, 
  useCreateCarouselSlide, 
  useUpdateCarouselSlide, 
  useDeleteCarouselSlide,
  CarouselSlide
} from '@/lib/hooks/use-carousel';

interface FormValues {
  carousel_products: string[];
  carousel_max_slides: number;
  new_products_limit: number;
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
  store_enabled?: boolean;
  store_message?: string;
}

export default function CmsSection() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useConfig();
  const updateMutation = useUpdateConfig();

  // Products query hook for selection
  const { data: products = [], isLoading: isProductsLoading } = useProducts(true);

  // Carousel query hooks
  const { data: slides = [], isLoading: isSlidesLoading } = useCarouselSlides();
  const createSlideMutation = useCreateCarouselSlide();
  const updateSlideMutation = useUpdateCarouselSlide();
  const deleteSlideMutation = useDeleteCarouselSlide();
  const uploadImageMutation = useUploadImage();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  // Carousel slide modal states
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideDescription, setSlideDescription] = useState("");
  const [slideLinkUrl, setSlideLinkUrl] = useState("");
  const [slideImageUrl, setSlideImageUrl] = useState("");
  const [isSlideUploading, setIsSlideUploading] = useState(false);
  const [slideUploadError, setSlideUploadError] = useState<string | null>(null);
  const [isSlideSubmitting, setIsSlideSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<FormValues>({
    values: config
  });

  const isSubmitting = updateMutation.isPending;

  const rawSelectedSlugs = watch('carousel_products') || [];
  const validProductSlugs = products.map(p => p.slug);
  const selectedSlugs = rawSelectedSlugs.filter(slug => validProductSlugs.includes(slug));
  const maxSlidesInput = Number(watch("carousel_max_slides")) + 1 || 5;

  const totalCurrentSlides = selectedSlugs.length + slides.length;
  const isLimitReached = totalCurrentSlides >= maxSlidesInput;

  // Filter products by search query
  const filteredChecklistProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  // Progressive/Lazy loading scroll handler
  const handleChecklistScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 20) {
      if (visibleCount < filteredChecklistProducts.length) {
        setVisibleCount((prev) => prev + 9);
      }
    }
  };

  const visibleProducts = filteredChecklistProducts.slice(0, visibleCount);

  const handleOpenSlideModal = (slide?: CarouselSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideTitle(slide.title);
      setSlideDescription(slide.description);
      setSlideLinkUrl(slide.linkUrl || "");
      setSlideImageUrl(slide.imageUrl);
    } else {
      setEditingSlide(null);
      setSlideTitle("");
      setSlideDescription("");
      setSlideLinkUrl("");
      setSlideImageUrl("");
    }
    setSlideUploadError(null);
    setSlideModalOpen(true);
  };

  const handleCloseSlideModal = () => {
    setSlideModalOpen(false);
    setEditingSlide(null);
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSlideUploadError(null);
    setIsSlideUploading(true);

    try {
      // Convert to WebP format before uploading
      const webpBlob = await convertToWebP(file);
      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const webpFileName = `${baseName}.webp`;
      const webpFile = new File([webpBlob], webpFileName, { type: "image/webp" });

      if (webpFile.size > 10 * 1024 * 1024) {
        setSlideUploadError("La taille de l'image doit être inférieure à 10 Mo");
        setIsSlideUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", webpFile);

      const data = await uploadImageMutation.mutateAsync(formData);
      setSlideImageUrl(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec du chargement de l'image";
      console.error(msg);
      setSlideUploadError(msg);
    } finally {
      setIsSlideUploading(false);
    }
  };

  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle || !slideImageUrl) {
      alert("Le titre et l'image sont obligatoires.");
      return;
    }

    setIsSlideSubmitting(true);

    try {
      if (editingSlide) {
        await updateSlideMutation.mutateAsync({
          id: editingSlide.id,
          payload: {
            title: slideTitle,
            description: slideDescription,
            imageUrl: slideImageUrl,
            linkUrl: slideLinkUrl || null,
          }
        });
      } else {
        await createSlideMutation.mutateAsync({
          title: slideTitle,
          description: slideDescription,
          imageUrl: slideImageUrl,
          linkUrl: slideLinkUrl || null,
        });
      }
      handleCloseSlideModal();
    } catch (err) {
      console.error("Failed to save slide:", err);
      alert("Une erreur est survenue lors de l'enregistrement de la diapositive.");
    } finally {
      setIsSlideSubmitting(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette diapositive ?")) return;

    try {
      await deleteSlideMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete slide:", err);
      alert("Échec de la suppression de la diapositive.");
    }
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    try {
      const currentOrder = currentSlide.order;
      const targetOrder = targetSlide.order;

      await Promise.all([
        updateSlideMutation.mutateAsync({ id: currentSlide.id, payload: { order: targetOrder } }),
        updateSlideMutation.mutateAsync({ id: targetSlide.id, payload: { order: currentOrder } })
      ]);
    } catch (err) {
      console.error("Failed to reorder slide:", err);
      alert("Échec de la réorganisation de la diapositive.");
    }
  };

  const onSubmit = async (data: any) => {
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const validProductSlugs = products.map(p => p.slug);
      const cleanedProducts = (data.carousel_products || []).filter((slug: string) => validProductSlugs.includes(slug));
      const cleanedData = {
        ...data,
        carousel_products: cleanedProducts
      };
      await updateMutation.mutateAsync(cleanedData);
      setValue('carousel_products', cleanedProducts);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Échec de l'enregistrement des configurations.");
    }
  };

  if (isConfigLoading || isSlidesLoading || isProductsLoading) {
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
    <div className="space-y-lg pb-xl relative font-sans">
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

      {/* SECTION 1: Carousel Manager */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Carousel de l'accueil</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">
              Combinez la sélection de produits existants et des images personnalisées (limite totale globale).
            </p>
          </div>
          <button
            type="button"
            disabled={isLimitReached}
            onClick={() => handleOpenSlideModal()}
            className="rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft hover:bg-surface-tint flex items-center gap-xs self-start disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Ajouter une image
          </button>
        </div>

        {/* Dynamic Warning Badge */}
        {isLimitReached && (
          <div className="rounded-xl bg-secondary-container/30 border border-secondary-fixed/50 p-sm text-on-secondary-container text-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">info</span>
            <span>
              Limite totale de <strong>{maxSlidesInput}</strong> diapositives atteinte (Produits + Images). Pour en rajouter, désélectionnez des produits ou supprimez des images.
            </span>
          </div>
        )}

        {/* Slide Controls Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm max-w-lg">
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">Nombre maximum de diapositives</label>
            <input
              type="number"
              min={1}
              {...register('carousel_max_slides', { required: true, min: 1, valueAsNumber: true })}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">Limite des nouveaux produits</label>
            <input
              type="number"
              min={1}
              {...register('new_products_limit', { required: true, min: 1, valueAsNumber: true })}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
            />
          </div>
        </div>

        {/* Subsection A: Product Selection Checklist */}
        <div className="space-y-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
            <div>
              <h3 className="font-semibold text-base text-on-surface">1. Sélectionner des produits</h3>
              <p className="text-xs text-on-surface-variant mt-[2px]">
                Cochez les produits que vous souhaitez mettre en avant dans les diapositives.
                <span className="font-bold text-primary ml-xs">({selectedSlugs.length} sélectionné(s))</span>
              </p>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setVisibleCount(9); // Reset lazy loading count
                }}
                className="rounded-lg border border-outline-variant bg-surface-container-low py-1 pl-7 pr-3 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 w-full sm:w-60"
              />
            </div>
          </div>

          <div 
            onScroll={handleChecklistScroll}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm max-h-[220px] overflow-y-auto border border-outline-variant/20 rounded-xl p-sm bg-surface-container-low/30"
          >
            {visibleProducts.length === 0 ? (
              <div className="col-span-full py-md text-center text-xs text-on-surface-variant italic">
                Aucun produit ne correspond à votre recherche.
              </div>
            ) : (
              visibleProducts.map((product) => {
                const isChecked = selectedSlugs.includes(product.slug);
                // Disable checking if unchecked and limit reached
                const disabled = !isChecked && isLimitReached;
                
                return (
                  <label 
                    key={product.id} 
                    className={`flex items-center gap-sm border rounded-xl p-sm cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary-container/5' : 'border-outline-variant/30 hover:bg-surface-container-low'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue('carousel_products', [...selectedSlugs, product.slug], { shouldDirty: true });
                        } else {
                          setValue('carousel_products', selectedSlugs.filter((s) => s !== product.slug), { shouldDirty: true });
                        }
                      }}
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface truncate text-sm">{product.title}</p>
                      <p className="text-xs text-on-surface-variant capitalize">{product.category}</p>
                    </div>
                  </label>
                );
              })
            )}

            {visibleCount < filteredChecklistProducts.length && (
              <div className="col-span-full py-xs text-center text-[10px] text-on-surface-variant/80 animate-pulse font-medium">
                Défilez vers le bas pour charger plus de produits...
              </div>
            )}
          </div>
        </div>

        {/* Subsection B: Custom Uploaded Slides list */}
        <div className="space-y-sm pt-sm">
          <div>
            <h3 className="font-semibold text-base text-on-surface">2. Téléverser de nouvelles images</h3>
            <p className="text-xs text-on-surface-variant mt-[2px]">
              Gérez des diapositives d'images sur-mesure (promotions, nouveautés, fêtes).
              <span className="font-bold text-primary ml-xs">({slides.length} image(s))</span>
            </p>
          </div>

          {slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-lg text-center text-on-surface-variant border-2 border-dashed border-outline-variant/30 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-outline mb-xs">add_photo_alternate</span>
              <p className="font-semibold text-sm">Aucune image personnalisée</p>
              <p className="text-xs">Utilisez le bouton "Ajouter une image" en haut à droite pour importer une diapositive.</p>
            </div>
          ) : (
            <div className="space-y-sm">
              {slides.map((slide, index) => (
                <div key={slide.id} className="flex flex-col sm:flex-row items-center gap-md border border-outline-variant/30 rounded-2xl p-md bg-surface-container-low">
                  <div className="relative aspect-[16/9] w-full sm:w-40 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0">
                    <img src={slide.imageUrl} alt={slide.title} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-grow min-w-0 text-left w-full">
                    <h3 className="font-semibold text-on-surface text-base truncate">{slide.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-xs">{slide.description}</p>
                    {slide.linkUrl && (
                      <span className="inline-block text-[11px] font-bold text-primary mt-sm bg-primary/10 px-sm py-0.5 rounded-full truncate max-w-full">
                        Lien: {slide.linkUrl}
                      </span>
                    )}
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-xs flex-shrink-0 mt-md sm:mt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSlide(index, 'up')}
                      className="p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                      title="Monter"
                    >
                      <span className="material-symbols-outlined text-xl">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => handleMoveSlide(index, 'down')}
                      className="p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                      title="Descendre"
                    >
                      <span className="material-symbols-outlined text-xl">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSlideModal(slide)}
                      className="p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors"
                      title="Modifier"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-sm rounded-full text-error hover:bg-error-container/20 transition-colors"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

        {/* SECTION: Statut de la Boutique */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Statut de la Boutique</h2>
            <p className="text-sm text-on-surface-variant mt-[2px]">Activer ou désactiver temporairement les commandes des clients.</p>
          </div>

          <div className="space-y-sm">
            <div className="flex items-center gap-md">
              <label className="text-sm font-bold text-on-surface-variant flex-shrink-0">Prise de commande :</label>
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={() => setValue('store_enabled', true, { shouldDirty: true })}
                  className={`rounded-full px-md py-xs text-sm font-semibold transition-all ${
                    watch('store_enabled') === true
                      ? 'bg-emerald-500 text-white shadow-soft'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  Ouvert (ON)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('store_enabled', false, { shouldDirty: true })}
                  className={`rounded-full px-md py-xs text-sm font-semibold transition-all ${
                    watch('store_enabled') === false
                      ? 'bg-rose-500 text-white shadow-soft'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  Fermé (OFF)
                </button>
              </div>
            </div>

            {watch('store_enabled') === false && (
              <div className="flex flex-col gap-xs animate-fade-in">
                <label className="text-sm font-bold text-on-surface-variant">Message d'indisponibilité (ex: Vacances, Maintenance, Fermeture temporaire)</label>
                <textarea
                  rows={2}
                  {...register('store_message', { required: watch('store_enabled') === false })}
                  placeholder="Nous sommes fermés pour les vacances d'été. Réouverture le 10 Juillet !"
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
                />
              </div>
            )}
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

      {/* Slide Modal Dialog */}
      {slideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-md md:p-lg shadow-2xl space-y-md animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm">
              <h3 className="font-display text-xl font-bold text-on-surface">
                {editingSlide ? "Modifier la diapositive" : "Ajouter une diapositive"}
              </h3>
              <button
                type="button"
                onClick={handleCloseSlideModal}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSlideSubmit} className="space-y-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Titre *</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  placeholder="Ex: Coming Soon, Promotion, Holiday Announcement..."
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Description</label>
                <textarea
                  rows={3}
                  value={slideDescription}
                  onChange={(e) => setSlideDescription(e.target.value)}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none w-full"
                  placeholder="Description affichée sur la diapositive..."
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Lien URL (optionnel)</label>
                <input
                  type="text"
                  value={slideLinkUrl}
                  onChange={(e) => setSlideLinkUrl(e.target.value)}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary w-full"
                  placeholder="Ex: /our-product/dziriettes ou externe"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-bold text-on-surface-variant">Image du carousel *</label>
                <div className="flex flex-col items-center gap-sm sm:flex-row">
                  {slideImageUrl && (
                    <div className="relative aspect-[16/9] w-full sm:w-36 rounded-xl overflow-hidden bg-neutral-900 border border-outline-variant">
                      <img src={slideImageUrl} alt="Slide Preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlideImageUpload}
                      disabled={isSlideUploading}
                      className="w-full text-sm text-on-surface-variant file:mr-md file:py-xs file:px-sm file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-surface-tint cursor-pointer"
                    />
                    {isSlideUploading && <p className="text-xs text-primary font-medium mt-xs animate-pulse">Chargement de l'image...</p>}
                    {slideUploadError && <p className="text-xs text-error font-medium mt-xs">{slideUploadError}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-sm mt-md">
                <button
                  type="button"
                  onClick={handleCloseSlideModal}
                  className="rounded-full border border-outline-variant px-lg py-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSlideSubmitting || isSlideUploading || !slideImageUrl}
                  className="rounded-full bg-primary px-lg py-sm font-semibold text-white hover:bg-surface-tint disabled:opacity-50"
                >
                  {isSlideSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
