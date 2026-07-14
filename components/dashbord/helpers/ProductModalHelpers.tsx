import React from 'react';
import Image from 'next/image';

const CATEGORIES_MAPPING = [
  { value: 'gâteau', label: 'Gâteau' },
  { value: 'aliments traditionnel', label: 'Aliment Traditionnel' },
];

// ============================================================================
// 1. ProductBasicInfo
// ============================================================================

interface ProductBasicInfoProps {
  modalMode: 'create' | 'edit';
  title: string;
  setTitle: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
}

export function ProductBasicInfo({
  modalMode,
  title,
  setTitle,
  slug,
  setSlug,
  price,
  setPrice,
  category,
  setCategory,
}: ProductBasicInfoProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <div className="flex flex-col gap-xs">
          <label className="text-sm font-bold text-on-surface-variant">
            Titre du produit *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Gâteau au Chocolat"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (modalMode === "create") {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-ء-ي]/g, ""),
                );
              }
            }}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-on-surface-variant">
              Slug *
            </label>
            <button
              type="button"
              onClick={() => {
                setSlug(
                  title
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-ء-ي]/g, "")
                );
              }}
              className="text-xs font-bold text-primary hover:text-surface-tint flex items-center gap-[2px] transition-colors"
              title="Générer le slug à partir du titre"
            >
              <span className="material-symbols-outlined text-sm">autorenew</span>
              Générer
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="Ex: gateau-au-chocolat"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
            }
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <div className="flex flex-col gap-xs">
          <label className="text-sm font-bold text-on-surface-variant">
            Prix *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: 45.00 €"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-sm font-bold text-on-surface-variant">
            Catégorie *
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-sm pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-[46px] appearance-none cursor-pointer"
            >
              {CATEGORIES_MAPPING.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// 2. ProductImageUpload
// ============================================================================

interface ProductImageUploadProps {
  imageUrl: string;
  setImageUrl: (v: string) => void;
  isUploading: boolean;
  uploadError: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductImageUpload({
  imageUrl,
  setImageUrl,
  isUploading,
  uploadError,
  onFileUpload,
}: ProductImageUploadProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-bold text-on-surface-variant">
        Image du produit *
      </label>

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-2xl p-md bg-surface-container-low/50 hover:bg-surface-container-low transition-colors relative group">
        {imageUrl ? (
          <div className="relative w-full flex flex-col items-center gap-sm">
            <div className="relative h-36 w-full max-w-xs overflow-hidden rounded-xl border border-outline-variant/30 shadow-md">
              <Image
                src={imageUrl}
                alt="Aperçu du produit"
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Voulez-vous vraiment enlever cette image ?")) {
                  setImageUrl("");
                }
              }}
              className="rounded-xl bg-error/10 px-md py-sm text-xs font-bold text-error hover:bg-error/20 transition-colors flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Supprimer l'image
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center cursor-pointer py-md w-full gap-sm">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-3xl">image</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-primary hover:underline block">
                Aucune image chargée. Cliquez pour en importer une.
              </span>
              <span className="text-xs text-on-surface-variant/80 mt-[2px] block">
                PNG, JPG, WEBP jusqu'à 10 Mo
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs flex flex-col items-center justify-center gap-xs rounded-2xl">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="text-xs font-bold text-primary">
              Chargement de l'image...
            </span>
          </div>
        )}
      </div>

      {uploadError && (
        <span className="text-xs text-error font-medium flex items-center gap-xs">
          <span className="material-symbols-outlined text-xs select-none">error</span>
          {uploadError}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 3. ProductDetailsInfo
// ============================================================================

interface ProductDetailsInfoProps {
  limitBay: string;
  setLimitBay: (v: string) => void;
  state: string;
  setState: (v: 'exist' | 'outofStock' | 'commingSoun') => void;
}

export function ProductDetailsInfo({
  limitBay,
  setLimitBay,
  state,
  setState,
}: ProductDetailsInfoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          Limite d'achat
        </label>
        <input
          type="number"
          placeholder="Ex: 5"
          value={limitBay}
          onChange={(e) => setLimitBay(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          État *
        </label>
        <div className="relative">
          <select
            value={state}
            onChange={(e) => setState(e.target.value as 'exist' | 'outofStock' | 'commingSoun')}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-sm pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-[46px] appearance-none cursor-pointer"
          >
            <option value="exist">Disponible</option>
            <option value="outofStock">Indisponible</option>
            <option value="commingSoun">Bientôt</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
            arrow_drop_down
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ProductMetrics
// ============================================================================

interface ProductMetricsProps {
  visibility: string;
  setVisibility: (v: string) => void;
}

export function ProductMetrics({
  visibility,
  setVisibility,
}: ProductMetricsProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-bold text-on-surface-variant">
        Score de visibilité
      </label>
      <input
        type="number"
        placeholder="Ex: 10"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// ============================================================================
// 5. ProductTagsEditor
// ============================================================================

interface ProductTagsEditorProps {
  tags: string[];
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ProductTagsEditor({
  tags,
  newTagInput,
  setNewTagInput,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
}: ProductTagsEditorProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-bold text-on-surface-variant">
        Mots-clés (Tags)
      </label>
      <div className="flex gap-xs">
        <input
          type="text"
          placeholder="Ex: لوز, شوكولا, زيت..."
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={onAddTag}
          className="rounded-xl bg-secondary-container px-md py-sm text-sm font-bold text-on-secondary-container hover:bg-outline-variant/30 transition-all flex items-center justify-center"
        >
          Ajouter
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-xs mt-xs border border-outline-variant/30 rounded-2xl p-sm bg-surface-container-low/40">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-xs rounded-full bg-primary/10 border border-primary/20 px-sm py-1 text-xs font-bold text-primary transition-all animate-scale-up"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="rounded-full p-[2px] text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center"
                title="Supprimer"
              >
                <span className="material-symbols-outlined text-xs select-none">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. ProductDescriptionStory
// ============================================================================

interface ProductDescriptionStoryProps {
  description: string;
  setDescription: (v: string) => void;
  story: string;
  setStory: (v: string) => void;
}

export function ProductDescriptionStory({
  description,
  setDescription,
  story,
  setStory,
}: ProductDescriptionStoryProps) {
  return (
    <>
      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          Description *
        </label>
        <textarea
          required
          rows={3}
          placeholder="Décrivez brièvement le produit..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          Histoire *
        </label>
        <textarea
          required
          rows={3}
          placeholder="Racontez l'histoire/l'héritage du produit..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>
    </>
  );
}
