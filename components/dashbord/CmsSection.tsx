"use client";

import React from 'react';
import { useCmsSection } from './hooks/useCmsSection';
import {
  ShopStatusSection,
  CarouselManagerSection,
  HomepageStorySection,
  AboutHistorySection,
  ContactSocialSection,
  SlideModal
} from './helpers/CmsSectionHelpers';

export default function CmsSection() {
  const {
    isConfigLoading,
    configError,
    saveSuccess,
    saveError,
    isSubmitting,
    isDirty,
    register,
    handleSubmit,
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
  } = useCmsSection();

  if (isConfigLoading) {
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

      <form onSubmit={handleSubmit} className="space-y-lg">
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
