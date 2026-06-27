"use client";

import { useState } from 'react';
import { convertToWebP } from '@/lib/image-utils';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateProduct, useUpdateProduct, useUploadImage } from '@/lib/hooks/use-products';
import {
  ProductBasicInfo,
  ProductImageUpload,
  ProductDetailsInfo,
  ProductMetrics,
  ProductTagsEditor,
  ProductDescriptionStory
} from './helpers/ProductModalHelpers';

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
    rating,
    setRating,
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
      // Convert image to WebP format before uploading
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
      rating: rating.trim() === '' ? 0.0 : Number(rating),
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
          {/* Title, Slug, Price, Category */}
          <ProductBasicInfo
            modalMode={modalMode}
            title={title}
            setTitle={setTitle}
            slug={slug}
            setSlug={setSlug}
            price={price}
            setPrice={setPrice}
            category={category}
            setCategory={setCategory}
          />

          {/* Product Image Upload Zone */}
          <ProductImageUpload
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            isUploading={isUploading}
            uploadError={uploadError}
            onFileUpload={handleFileUpload}
          />

          {/* Limit Buy, State, Published At */}
          <ProductDetailsInfo
            limitBay={limitBay}
            setLimitBay={setLimitBay}
            state={state}
            setState={setState}
            publishedAt={publishedAt}
            setPublishedAt={setPublishedAt}
          />

          {/* Visibility score and Rating */}
          <ProductMetrics
            visibility={visibility}
            setVisibility={setVisibility}
            rating={rating}
            setRating={setRating}
          />

          {/* Tags Editor */}
          <ProductTagsEditor
            tags={tags}
            newTagInput={newTagInput}
            setNewTagInput={setNewTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onTagKeyDown={handleTagKeyDown}
          />

          {/* Description and Story */}
          <ProductDescriptionStory
            description={description}
            setDescription={setDescription}
            story={story}
            setStory={setStory}
          />

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
