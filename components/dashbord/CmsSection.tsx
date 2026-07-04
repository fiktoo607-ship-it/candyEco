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
    <div className="space-y-md md:space-y-lg pb-xl relative font-sans">
      {/* Toast Notifications */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 md:top-24 md:bottom-auto z-50 rounded-xl bg-emerald-600 px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in border border-emerald-500/30">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="font-semibold text-sm">Configurations enregistrées avec succès !</span>
        </div>
      )}

      {saveError && (
        <div className="fixed bottom-6 right-6 md:top-24 md:bottom-auto z-50 rounded-xl bg-error px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in border border-error-container/20">
          <span className="material-symbols-outlined text-xl">error</span>
          <span className="font-semibold text-sm">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-md md:space-y-lg">
        {/* Floating Save Actions (Glassmorphism design) */}
        {isDirty && (
          <div className="sticky top-[72px] md:top-[80px] z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-sm border border-outline-variant/30 bg-surface/85 backdrop-blur-lg p-sm md:p-md rounded-2xl shadow-soft mb-md transition-all animate-fade-in">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-lg text-amber-500 animate-pulse">
                pending_actions
              </span>
              <p className="text-xs md:text-sm font-semibold text-on-surface-variant">
                Modifications non enregistrées
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto justify-center rounded-full bg-primary px-lg py-sm font-semibold text-white shadow-soft hover:bg-surface-tint active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-xs text-sm"
            >
              {isSubmitting ? (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              Enregistrer les modifications
            </button>
          </div>
        )}

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
