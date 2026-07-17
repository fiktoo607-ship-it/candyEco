import React from 'react';
import { CarouselSlide } from '@/lib/hooks/use-carousel';

interface CarouselManagerSectionProps {
  isLimitReached: boolean;
  maxSlidesInput: number;
  handleOpenSlideModal: (slide?: CarouselSlide) => void;
  register: any;
  setValue: any;
  selectedSlugs: string[];
  productSearchQuery: string;
  setProductSearchQuery: (q: string) => void;
  visibleCount: number;
  setVisibleCount: any;
  visibleProducts: any[];
  filteredChecklistProducts: any[];
  handleChecklistScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  slides: CarouselSlide[];
  handleMoveSlide: (index: number, direction: 'up' | 'down') => void;
  handleDeleteSlide: (id: string) => void;
}

export function CarouselManagerSection({
  isLimitReached,
  maxSlidesInput,
  handleOpenSlideModal,
  register,
  setValue,
  selectedSlugs,
  productSearchQuery,
  setProductSearchQuery,
  visibleCount,
  setVisibleCount,
  visibleProducts,
  filteredChecklistProducts,
  handleChecklistScroll,
  slides,
  handleMoveSlide,
  handleDeleteSlide,
}: CarouselManagerSectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-3xl text-primary">view_carousel</span>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">
              Carousel de l'accueil
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">
              Sélectionnez des produits existants et des images personnalisées.
            </p>
          </div>
        </div>
      </div>

      {isLimitReached && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-sm text-amber-800 text-xs flex items-center gap-xs animate-pulse">
          <span className="material-symbols-outlined text-base">lock</span>
          <span>
            Limite totale de <strong>{maxSlidesInput - 1}</strong> diapositives atteinte (Produits + Images). Désélectionnez des produits ou supprimez des images pour en rajouter.
          </span>
        </div>
      )}

      {/* Slide Controls Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md max-w-xl bg-surface-container-lowest/50 p-sm rounded-xl border border-outline-variant/10">
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">filter_1</span>
            Nombre maximum de diapositives
          </label>
          <input
            type="number"
            min={1}
            {...register("carousel_max_slides", {
              required: true,
              min: 1,
              valueAsNumber: true,
            })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">new_releases</span>
            Limite des nouveaux produits
          </label>
          <input
            type="number"
            min={1}
            {...register("new_products_limit", {
              required: true,
              min: 1,
              valueAsNumber: true,
            })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
          />
        </div>
      </div>

      {/* Subsection A: Product Selection Checklist */}
      <div className="space-y-sm border-t border-outline-variant/10 pt-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <div>
            <h3 className="font-semibold text-base text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-lg text-primary">check_box</span>
              1. Sélectionner des produits
            </h3>
            <p className="text-xs text-on-surface-variant mt-[2px]">
              Cochez les produits à mettre en avant dans le carousel.
              <span className="font-bold text-primary ml-xs">
                ({selectedSlugs.length} sélectionné(s))
              </span>
            </p>
          </div>
          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={productSearchQuery}
              onChange={(e) => {
                setProductSearchQuery(e.target.value);
                setVisibleCount(9);
              }}
              className="rounded-xl border border-outline-variant bg-surface-container-low py-2 pl-9 pr-3 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 w-full"
            />
          </div>
        </div>

        <div
          onScroll={handleChecklistScroll}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm max-h-[220px] overflow-y-auto border border-outline-variant/20 rounded-xl p-sm bg-surface-container-low/30"
        >
          {visibleProducts.length === 0 ? (
            <div className="col-span-full py-md text-center text-xs text-on-surface-variant italic">
              Aucun produit ne correspond à votre recherche.
            </div>
          ) : (
            visibleProducts.map((product) => {
              const isChecked = selectedSlugs.includes(product.slug);
              const disabled = !isChecked && isLimitReached;

              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-sm border rounded-xl p-sm cursor-pointer transition-all ${
                    isChecked 
                      ? "border-primary bg-primary/5 shadow-soft" 
                      : "border-outline-variant/30 hover:bg-surface-container-low"
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue(
                            "carousel_products",
                            [...selectedSlugs, product.slug],
                            { shouldDirty: true },
                          );
                        } else {
                          setValue(
                            "carousel_products",
                            selectedSlugs.filter((s) => s !== product.slug),
                            { shouldDirty: true },
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate text-xs md:text-sm">
                      {product.title}
                    </p>
                    <p className="text-[10px] md:text-xs text-on-surface-variant capitalize">
                      {product.category}
                    </p>
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
      <div className="space-y-sm border-t border-outline-variant/10 pt-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <div>
            <h3 className="font-semibold text-base text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-lg text-primary">add_a_photo</span>
              2. Téléverser de nouvelles images
            </h3>
            <p className="text-xs text-on-surface-variant mt-[2px]">
              Gérez des diapositives d'images sur-mesure (promotions, nouveautés, fêtes).
              <span className="font-bold text-primary ml-xs">
                ({slides.length} image(s))
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={isLimitReached}
            onClick={() => handleOpenSlideModal()}
            className="w-full sm:w-auto rounded-full bg-primary px-md py-xs text-sm font-semibold text-white shadow-soft hover:bg-surface-tint flex items-center justify-center gap-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Ajouter une image
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-lg text-center text-on-surface-variant border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/10 p-md">
            <span className="material-symbols-outlined text-4xl text-outline mb-xs">
              add_photo_alternate
            </span>
            <p className="font-semibold text-sm text-on-surface">Aucune image personnalisée</p>
            <p className="text-xs text-on-surface-variant max-w-xs mt-[2px]">
              Utilisez le bouton "Ajouter une image" pour importer une nouvelle diapositive.
            </p>
          </div>
        ) : (
          <div className="space-y-sm">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="flex flex-col md:flex-row items-start md:items-center gap-sm md:gap-md border border-outline-variant/30 rounded-2xl p-sm md:p-md bg-surface-container-low transition-all hover:border-primary/20"
              >
                <div className="relative aspect-[16/9] w-full md:w-40 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 shadow-sm border border-outline-variant/10">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-grow min-w-0 text-left w-full mt-xs md:mt-0">
                  <h3 className="font-semibold text-on-surface text-sm md:text-base truncate">
                    {slide.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-[2px]">
                    {slide.description}
                  </p>
                  {slide.linkUrl && (
                    <span className="inline-flex items-center gap-[2px] text-[10px] font-bold text-primary mt-xs bg-primary/10 px-sm py-0.5 rounded-full truncate max-w-full">
                      <span className="material-symbols-outlined text-xs">link</span>
                      {slide.linkUrl}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-xs flex-shrink-0 mt-sm md:mt-0 w-full md:w-auto border-t border-outline-variant/10 md:border-t-0 pt-xs md:pt-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveSlide(index, "up")}
                    className="p-xs md:p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Monter"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">
                      arrow_upward
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={index === slides.length - 1}
                    onClick={() => handleMoveSlide(index, "down")}
                    className="p-xs md:p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Descendre"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">
                      arrow_downward
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenSlideModal(slide)}
                    className="p-xs md:p-sm rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-all"
                    title="Modifier"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-xs md:p-sm rounded-full text-error hover:bg-error-container/20 transition-all"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
