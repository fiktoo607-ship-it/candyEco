import React, { useState } from 'react';
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
import { useDashboardStore } from '@/lib/dashboard-store';


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

export function useCmsSection() {
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

  const { showToast } = useDashboardStore();
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
      showToast("Le titre et l'image sont obligatoires.", "error");
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
        showToast("Diapositive mise à jour avec succès !", "success");
      } else {
        await createSlideMutation.mutateAsync({
          title: slideTitle,
          description: slideDescription,
          imageUrl: slideImageUrl,
          linkUrl: slideLinkUrl || null,
        });
        showToast("Diapositive ajoutée avec succès !", "success");
      }
      handleCloseSlideModal();
    } catch (err) {
      console.error("Failed to save slide:", err);
      showToast("Une erreur est survenue lors de l'enregistrement de la diapositive.", "error");
    } finally {
      setIsSlideSubmitting(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette diapositive ?")) return;

    try {
      await deleteSlideMutation.mutateAsync(id);
      showToast("Diapositive supprimée avec succès !", "success");
    } catch (err) {
      console.error("Failed to delete slide:", err);
      showToast("Échec de la suppression de la diapositive.", "error");
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
      showToast("Diapositives réorganisées !", "success");
    } catch (err) {
      console.error("Failed to reorder slide:", err);
      showToast("Échec de la réorganisation de la diapositive.", "error");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const validProductSlugs = products.map(p => p.slug);
      const cleanedProducts = (data.carousel_products || []).filter((slug: string) => validProductSlugs.includes(slug));
      const cleanedData = {
        ...data,
        carousel_products: cleanedProducts
      };
      await updateMutation.mutateAsync(cleanedData);
      setValue('carousel_products', cleanedProducts);
      showToast("Configurations enregistrées avec succès !", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement des configurations.", "error");
    }
  };

  return {
    isConfigLoading: isConfigLoading || isSlidesLoading || isProductsLoading,
    configError,
    isSubmitting,
    isDirty,
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    setValue,
    selectedSlugs,
    isLimitReached,
    maxSlidesInput,
    handleOpenSlideModal,
    productSearchQuery,
    setProductSearchQuery,
    visibleProducts,
    filteredChecklistProducts,
    handleChecklistScroll,
    slides,
    handleMoveSlide,
    handleDeleteSlide,
    slideModalOpen,
    handleCloseSlideModal,
    editingSlide,
    slideTitle,
    setSlideTitle,
    slideDescription,
    setSlideDescription,
    slideLinkUrl,
    setSlideLinkUrl,
    slideImageUrl,
    setSlideImageUrl,
    isSlideUploading,
    slideUploadError,
    isSlideSubmitting,
    handleSlideImageUpload,
    handleSlideSubmit,
    visibleCount,
    setVisibleCount
  };
}
