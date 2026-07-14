import React from 'react';
import { CarouselSlide } from '@/lib/hooks/use-carousel';

// ============================================================================
// 1. ShopStatusSection
// ============================================================================

interface ShopStatusSectionProps {
  register: any;
  watch: any;
  setValue: any;
}

export function ShopStatusSection({ register, watch, setValue }: ShopStatusSectionProps) {
  const isEnabled = watch('store_enabled');

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span
          className={`material-symbols-outlined text-3xl ${isEnabled ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}
        >
          {isEnabled ? "store" : "storefront"}
        </span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">
            Statut de la Boutique
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">
            Activer ou désactiver temporairement les commandes des clients.
          </p>
        </div>
      </div>

      <div className="space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-t border-outline-variant/10 pt-md">
          <label className="text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-lg">
              settings_power
            </span>
            Prise de commande :
          </label>
          <div className="flex items-center gap-sm w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setValue("store_enabled", true, { shouldDirty: true })
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-xs rounded-xl px-md py-xs text-sm font-semibold border transition-all ${
                isEnabled === true
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-soft font-bold"
                  : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              Ouvert
            </button>
            <button
              type="button"
              onClick={() =>
                setValue("store_enabled", false, { shouldDirty: true })
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-xs rounded-xl px-md py-xs text-sm font-semibold border transition-all ${
                isEnabled === false
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 shadow-soft font-bold"
                  : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              Fermé
            </button>
          </div>
        </div>

        {isEnabled === false && (
          <div className="flex flex-col gap-xs animate-fade-in border border-rose-500/20 bg-rose-500/[0.02] p-md rounded-xl space-y-xs">
            <div className="flex items-center gap-xs text-rose-600">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Alerte Boutique Fermée
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Saisissez le message d'indisponibilité temporaire qui sera visible
              par vos clients :
            </p>
            <textarea
              rows={2}
              {...register("store_message", { required: isEnabled === false })}
              placeholder="Nous sommes fermés pour les vacances d'été. Réouverture le 10 Juillet !"
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. CarouselManagerSection
// ============================================================================

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

// ============================================================================
// 3. HomepageStorySection
// ============================================================================

interface HomepageStorySectionProps {
  register: any;
}

export function HomepageStorySection({ register }: HomepageStorySectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">auto_stories</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Section Histoire de l'accueil</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez le slogan principal de la page d'accueil et sa description.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        <div className="flex flex-col gap-xs">
          <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-base">title</span>
            Slogan principal
          </label>
          <input
            type="text"
            {...register('homepage_story_title', { required: true })}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            placeholder="Saisissez un slogan percutant"
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
            placeholder="Décrivez votre boutique en quelques lignes"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. AboutHistorySection
// ============================================================================

interface AboutHistorySectionProps {
  register: any;
}

export function AboutHistorySection({ register }: AboutHistorySectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">history_edu</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Page Notre Histoire (About)</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Modifiez les textes narratifs et l'histoire de la boulangerie.</p>
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

// ============================================================================
// 5. ContactSocialSection
// ============================================================================

interface ContactSocialSectionProps {
  register: any;
}

export function ContactSocialSection({ register }: ContactSocialSectionProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span className="material-symbols-outlined text-3xl text-primary">contact_mail</span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">Contacts & Réseaux Sociaux</h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">Ces informations mettront à jour simultanément la page Contact et le Footer.</p>
        </div>
      </div>

      <div className="space-y-md border-t border-outline-variant/10 pt-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">call</span>
              Numéro de Téléphone
            </label>
            <input
              type="text"
              {...register('contact_phone', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">mail</span>
              Adresse Email
            </label>
            <input
              type="email"
              {...register('contact_email', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">location_on</span>
              Adresse Physique
            </label>
            <input
              type="text"
              {...register('contact_address', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs md:text-sm font-bold text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-base">schedule</span>
              Horaires d'ouverture
            </label>
            <input
              type="text"
              {...register('contact_hours', { required: true })}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
        </div>

        <hr className="border-outline-variant/10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md pt-xs">
          {/* Instagram Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-md space-y-md transition-all hover:bg-rose-500/[0.04]">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-2xl text-rose-500 bg-rose-500/10 p-sm rounded-xl">photo_camera</span>
              <div>
                <h3 className="font-semibold text-base text-on-surface">Instagram</h3>
                <p className="text-xs text-on-surface-variant">Lien vers le compte Instagram de la boutique</p>
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant">Lien URL</label>
              <input
                type="text"
                {...register('contact_social_instagram', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
              <label className="text-xs font-bold text-on-surface-variant">Nom d'utilisateur</label>
              <input
                type="text"
                {...register('contact_social_instagram_user', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
            </div>
          </div>

          {/* TikTok Card */}
          <div className="rounded-2xl border border-neutral-800/20 bg-neutral-800/[0.02] p-md space-y-md transition-all hover:bg-neutral-800/[0.04]">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-2xl text-on-surface bg-on-surface/10 p-sm rounded-xl">movie</span>
              <div>
                <h3 className="font-semibold text-base text-on-surface">TikTok</h3>
                <p className="text-xs text-on-surface-variant">Lien vers le compte TikTok de la boutique</p>
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant">Lien URL</label>
              <input
                type="text"
                {...register('contact_social_tiktok', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
              <label className="text-xs font-bold text-on-surface-variant">Nom d'utilisateur</label>
              <input
                type="text"
                {...register('contact_social_tiktok_user', { required: true })}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. SlideModal
// ============================================================================

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
