"use client";

import React from 'react';
import { useProductModal } from './hooks/useProductModal';
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
    title,
    setTitle,
    slug,
    setSlug,
    price,
    setPrice,
    imageUrl,
    setImageUrl,
    uploadError,
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
    newTagInput,
    setNewTagInput,
    isSubmitting,
    isUploading,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
    handleFileUpload,
    handleSubmit,
  } = useProductModal();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low flex-shrink-0">
          <h2 className="font-display text-xl font-bold text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-xl">
              {modalMode === "create" ? "add_box" : "edit_square"}
            </span>
            {modalMode === "create" ? "Ajouter un produit" : "Modifier le produit"}
          </h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-md flex flex-col gap-sm overflow-y-auto flex-grow"
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

          <footer className="mt-md flex justify-end gap-sm border-t border-outline-variant/20 pt-md mt-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="rounded-xl bg-primary px-md py-sm text-sm font-bold text-white hover:bg-surface-tint transition-all disabled:opacity-60 flex items-center gap-xs shadow-soft"
            >
              {(isSubmitting || isUploading) ? (
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-sm">save</span>
              )}
              {modalMode === "create" ? "Créer" : "Enregistrer les modifications"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
