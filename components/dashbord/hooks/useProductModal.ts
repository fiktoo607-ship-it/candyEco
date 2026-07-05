import React, { useState } from 'react';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateProduct, useUpdateProduct, useUploadImage } from '@/lib/hooks/use-products';
import { convertToWebP } from '@/lib/image-utils';

export function useProductModal() {
  const store = useDashboardStore();
  const [newTagInput, setNewTagInput] = useState("");

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUploadImage();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !store.tags.includes(trimmed)) {
      store.setTags([...store.tags, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    store.setTags(store.tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    store.setUploadError(null);

    try {
      // Convert image to WebP format before uploading
      const webpBlob = await convertToWebP(file);
      
      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const webpFileName = `${baseName}.webp`;

      const webpFile = new File([webpBlob], webpFileName, { type: "image/webp" });

      if (webpFile.size > 10 * 1024 * 1024) {
        store.setUploadError("La taille de l'image doit être inférieure à 10 Mo");
        return;
      }

      const formData = new FormData();
      formData.append("file", webpFile);

      const data = await uploadMutation.mutateAsync(formData);
      store.setImageUrl(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec du chargement de l'image";
      console.error(msg);
      store.setUploadError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      store.showToast("Veuillez attendre la fin du chargement de l'image.", "error");
      return;
    }
    if (!store.title || !store.slug || !store.price || !store.imageUrl || !store.description || !store.story) {
      store.showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    const payload = {
      title: store.title,
      slug: store.slug,
      price: store.price,
      imageUrl: store.imageUrl,
      description: store.description,
      story: store.story,
      category: store.category,
      limitBay: store.limitBay.trim() === '' ? null : Number(store.limitBay),
      state: store.state,
      visibility: store.visibility.trim() === '' ? 0 : Number(store.visibility),
      rating: store.rating.trim() === '' ? 0.0 : Number(store.rating),
      tags: store.tags,
      publishedAt: store.publishedAt ? new Date(store.publishedAt).toISOString() : null,
    };

    try {
      if (store.modalMode === 'create') {
        await createMutation.mutateAsync(payload);
        store.showToast("Produit créé avec succès !", "success");
      } else {
        if (!store.editingId) return;
        await updateMutation.mutateAsync({ id: store.editingId, payload });
        store.showToast("Produit mis à jour avec succès !", "success");
      }
      store.setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.";
      store.showToast(errMsg, "error");
    }
  };

  return {
    isModalOpen: store.isModalOpen,
    setIsModalOpen: store.setIsModalOpen,
    modalMode: store.modalMode,
    title: store.title,
    setTitle: store.setTitle,
    slug: store.slug,
    setSlug: store.setSlug,
    price: store.price,
    setPrice: store.setPrice,
    imageUrl: store.imageUrl,
    setImageUrl: store.setImageUrl,
    uploadError: store.uploadError,
    description: store.description,
    setDescription: store.setDescription,
    story: store.story,
    setStory: store.setStory,
    limitBay: store.limitBay,
    setLimitBay: store.setLimitBay,
    state: store.state,
    setState: store.setState,
    publishedAt: store.publishedAt,
    setPublishedAt: store.setPublishedAt,
    category: store.category,
    setCategory: store.setCategory,
    visibility: store.visibility,
    setVisibility: store.setVisibility,
    rating: store.rating,
    setRating: store.setRating,
    tags: store.tags,
    newTagInput,
    setNewTagInput,
    isSubmitting,
    isUploading,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
    handleFileUpload,
    handleSubmit,
  };
}
