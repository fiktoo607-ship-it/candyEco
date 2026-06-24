import { useState } from 'react';
import Image from 'next/image';
import { convertToWebP } from '@/lib/image-utils';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateProduct, useUpdateProduct, useUploadImage } from '@/lib/hooks/use-products';

const CATEGORIES_MAPPING = [
  { value: 'gâteau', label: 'Gâteau' },
  { value: 'aliments traditionnel', label: 'Aliment Traditionnel' },
];

export default function ProductModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    editingId,
    title,
    setTitle,
    slug,
    setSlug,
    price,
    setPrice,
    imageUrl,
    setImageUrl,
    uploadError,
    setUploadError,
    description,
    setDescription,
    story,
    setStory,
    limitBay,
    setLimitBay,
    state,
    setState,
    publishedAt,
    setPublishedAt,
    category,
    setCategory,
    visibility,
    setVisibility,
    tags,
    setTags,
  } = useDashboardStore();

  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUploadImage();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  if (!isModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    try {
      // Convert image to WebP format before uploading using image utility helper
      const webpBlob = await convertToWebP(file);
      
      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const webpFileName = `${baseName}.webp`;

      const webpFile = new File([webpBlob], webpFileName, { type: "image/webp" });

      if (webpFile.size > 10 * 1024 * 1024) {
        setUploadError("La taille de l'image doit être inférieure à 10 Mo");
        return;
      }

      const formData = new FormData();
      formData.append("file", webpFile);

      const data = await uploadMutation.mutateAsync(formData);
      setImageUrl(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec du chargement de l'image";
      console.error(msg);
      setUploadError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      alert("Veuillez attendre la fin du chargement de l'image.");
      return;
    }
    if (!title || !slug || !price || !imageUrl || !description || !story) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const payload = {
      title,
      slug,
      price,
      imageUrl,
      description,
      story,
      category,
      limitBay: limitBay.trim() === '' ? null : Number(limitBay),
      state,
      visibility: visibility.trim() === '' ? 0 : Number(visibility),
      tags,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    };

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        if (!editingId) return;
        await updateMutation.mutateAsync({ id: editingId, payload });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.";
      alert(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 className="font-display text-xl font-bold text-on-surface">
            {modalMode === "create" ? "Ajouter un nouveau produit" : "Modifier le produit"}
          </h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-md flex flex-col gap-sm overflow-y-auto max-h-[75vh]"
        >
          <div className="grid grid-cols-2 gap-sm">
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
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Slug *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: gateau-au-chocolat"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Prix *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 45.00 $"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              >
                {CATEGORIES_MAPPING.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="text-sm font-bold text-on-surface-variant">
              Image du produit *
            </label>

            {/* File Upload Zone */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-md bg-surface-container-low/50 hover:bg-surface-container-low transition-colors relative group">
              {imageUrl ? (
                <div className="relative w-full flex flex-col items-center gap-sm">
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-outline-variant/30 shadow-md">
                    <Image
                      src={imageUrl}
                      alt="Aperçu du produit"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="rounded-full bg-error/10 px-sm py-xs text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                  >
                    Supprimer l'image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-sm w-full">
                  <svg className="w-10 h-10 text-primary mb-xs" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <span className="text-sm font-semibold text-on-surface">
                    Cliquez pour charger une image
                  </span>
                  <span className="text-xs text-on-surface-variant/80 mt-[2px]">
                    PNG, JPG, WEBP jusqu'à 10 Mo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs flex flex-col items-center justify-center gap-xs rounded-xl">
                  <svg className="w-8 h-8 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span className="text-xs font-semibold text-primary">
                    Chargement de l'image...
                  </span>
                </div>
              )}
            </div>

            {uploadError && (
              <span className="text-xs text-error font-medium flex items-center gap-xs">
                <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {uploadError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-sm">
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                Limite d'achat
              </label>
              <input
                type="number"
                placeholder="Ex: 5"
                value={limitBay}
                onChange={(e) => setLimitBay(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                État *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as 'exist' | 'outofStock' | 'commingSoun')}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              >
                <option value="exist">Disponible</option>
                <option value="outofStock">Indisponible</option>
                <option value="commingSoun">Bientôt</option>
              </select>
            </div>
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                Date de publication
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">
              Score de visibilité
            </label>
            <input
              type="number"
              placeholder="Ex: 10 (un score plus élevé = meilleure visibilité sur l'accueil)"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
            />
          </div>

          {/* Tags Field Editor */}
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
                onKeyDown={handleTagKeyDown}
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-lg bg-secondary-container px-md py-xs text-sm font-semibold text-on-secondary-container hover:bg-outline-variant/30 transition-colors"
              >
                Ajouter
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-xs mt-xs border border-outline-variant/30 rounded-xl p-xs bg-surface-container-low/40">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-xs rounded-full bg-primary/10 border border-primary/20 px-sm py-0.5 text-xs font-semibold text-primary transition-all animate-scale-up"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-[2px] text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center"
                      title="Supprimer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">
              Description *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Décrivez brièvement le produit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">
              Histoire *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Racontez l'histoire/l'héritage du produit..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none"
            />
          </div>

          <footer className="mt-md flex justify-end gap-sm border-t border-outline-variant/20 pt-md">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="rounded-lg bg-primary px-md py-sm font-semibold text-white hover:bg-surface-tint disabled:opacity-60 flex items-center gap-xs"
            >
              {(isSubmitting || isUploading) && (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              {modalMode === "create" ? "Créer" : "Enregistrer les modifications"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
