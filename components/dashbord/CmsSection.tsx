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
import {
  ShopStatusSection,
  CarouselManagerSection,
  HomepageStorySection,
  AboutHistorySection,
  ContactSocialSection,
  SlideModal
} from './helpers/CmsSectionHelpers';

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
        <ShopStatusSection register={register} watch={watch} setValue={setValue} />

        {/* SECTION 1: Carousel Manager */}
        <CarouselManagerSection 
          isLimitReached={isLimitReached}
          maxSlidesInput={maxSlidesInput}
          handleOpenSlideModal={handleOpenSlideModal}
          register={register}
          setValue={setValue}
          selectedSlugs={selectedSlugs}
          productSearchQuery={productSearchQuery}
          setProductSearchQuery={setProductSearchQuery}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          visibleProducts={visibleProducts}
          filteredChecklistProducts={filteredChecklistProducts}
          handleChecklistScroll={handleChecklistScroll}
          slides={slides}
          handleMoveSlide={handleMoveSlide}
          handleDeleteSlide={handleDeleteSlide}
        />

        {/* SECTION 2: Slogan & Story de l'accueil */}
        <HomepageStorySection register={register} />

        {/* SECTION 3: Page Notre Histoire */}
        <AboutHistorySection register={register} />

        {/* SECTION 4: Contacts & Réseaux Sociaux */}
        <ContactSocialSection register={register} />
      </form>

      {/* Slide Modal Dialog */}
      <SlideModal
        isOpen={slideModalOpen}
        onClose={handleCloseSlideModal}
        editingSlide={editingSlide}
        slideTitle={slideTitle}
        setSlideTitle={setSlideTitle}
        slideDescription={slideDescription}
        setSlideDescription={setSlideDescription}
        slideLinkUrl={slideLinkUrl}
        setSlideLinkUrl={setSlideLinkUrl}
        slideImageUrl={slideImageUrl}
        setSlideImageUrl={setSlideImageUrl}
        isSlideUploading={isSlideUploading}
        slideUploadError={slideUploadError}
        isSlideSubmitting={isSlideSubmitting}
        handleSlideImageUpload={handleSlideImageUpload}
        handleSlideSubmit={handleSlideSubmit}
      />
    </div>
  );
}
