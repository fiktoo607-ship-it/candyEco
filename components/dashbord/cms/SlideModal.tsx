import React from 'react';
import { CarouselSlide } from '@/lib/hooks/use-carousel';

interface SlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSlide: CarouselSlide | null;
  slideTitle: string;
  setSlideTitle: (val: string) => void;
  slideDescription: string;
  setSlideDescription: (val: string) => void;
  slideLinkUrl: string;
  setSlideLinkUrl: (val: string) => void;
  slideImageUrl: string;
  setSlideImageUrl: (val: string) => void;
  isSlideUploading: boolean;
  slideUploadError: string | null;
  isSlideSubmitting: boolean;
  handleSlideImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSlideSubmit: (e: React.FormEvent) => void;
}

export function SlideModal({
  isOpen,
  onClose,
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
}: SlideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-sm md:p-md backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in text-left">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-md flex-shrink-0">
          <h3 className="font-display text-lg md:text-xl font-bold text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-xl">add_photo_alternate</span>
            {editingSlide ? "Modifier la diapositive" : "Ajouter une diapositive"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSlideSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-md space-y-md">
            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant">Titre *</label>
              <input
                type="text"
                required
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
                placeholder="Ex: Coming Soon, Promotion, Holiday Announcement..."
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant">Description</label>
              <textarea
                rows={3}
                value={slideDescription}
                onChange={(e) => setSlideDescription(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
                placeholder="Description affichée sur la diapositive..."
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant">Lien URL (optionnel)</label>
              <input
                type="text"
                value={slideLinkUrl}
                onChange={(e) => setSlideLinkUrl(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
                placeholder="Ex: /our-product/dziriettes ou externe"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-xs md:text-sm font-bold text-on-surface-variant">Image du carousel *</label>
              <div className="flex flex-col gap-md">
                {slideImageUrl && (
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-outline-variant shadow-soft group">
                    <img src={slideImageUrl} alt="Slide Preview" className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300" />
                    <button
                      type="button"
                      onClick={() => setSlideImageUrl("")}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/85 text-white rounded-full p-1.5 transition-colors shadow-md flex items-center justify-center"
                      title="Supprimer l'image"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete</span>
                    </button>
                  </div>
                )}
                
                {!slideImageUrl && (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/60 hover:border-primary/60 bg-surface-container-low hover:bg-primary/5 rounded-2xl p-md text-center cursor-pointer transition-all ${isSlideUploading ? 'pointer-events-none opacity-50' : ''}`}>
                    <span className="material-symbols-outlined text-4xl text-outline mb-xs animate-pulse">cloud_upload</span>
                    <span className="text-sm font-semibold text-on-surface">Cliquez pour téléverser une image</span>
                    <span className="text-xs text-on-surface-variant mt-[2px]">Format WebP, PNG, JPG (Max 10Mo)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlideImageUpload}
                      disabled={isSlideUploading}
                      className="hidden"
                    />
                  </label>
                )}
                
                {isSlideUploading && (
                  <div className="flex items-center gap-sm bg-primary/5 border border-primary/20 p-sm rounded-xl animate-pulse">
                    <div className="w-5 h-5 text-primary animate-spin flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">sync</span>
                    </div>
                    <p className="text-xs text-primary font-semibold">Téléchargement de l'image en cours...</p>
                  </div>
                )}

                {slideUploadError && (
                  <div className="flex items-center gap-xs text-error text-xs font-semibold bg-error-container/10 border border-error/20 p-sm rounded-xl">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{slideUploadError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex justify-end gap-sm border-t border-outline-variant/30 p-md flex-shrink-0 bg-surface-container-lowest">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-outline-variant px-lg py-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSlideSubmitting || isSlideUploading || !slideImageUrl}
              className="rounded-full bg-primary px-lg py-sm font-semibold text-white hover:bg-surface-tint disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
            >
              {isSlideSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
