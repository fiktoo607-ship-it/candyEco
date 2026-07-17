import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateProduct, useUpdateProduct, useUploadImage, useProducts } from '@/lib/hooks/use-products';
import { convertToWebP } from '@/lib/image-utils';

const EMPTY_PRODUCTS: any[] = [];

export function useProductModal() {
  const store = useDashboardStore();
  
  // Localized React states for form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [limitBay, setLimitBay] = useState("");
  const [state, setState] = useState<'exist' | 'outofStock' | 'commingSoun'>("exist");
  const [publishedAt, setPublishedAt] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("0");
  const [rating, setRating] = useState("0.0");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const { data: products = EMPTY_PRODUCTS } = useProducts(true);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUploadImage();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  // Refs to track previous modal state and prevent infinite loops / overwrite on background refetches
  const prevIsOpen = React.useRef(false);
  const prevEditingId = React.useRef<string | null>(null);

  // Initialize or reset form state when the modal opens or the product being edited changes
  useEffect(() => {
    const opened = store.isModalOpen && !prevIsOpen.current;
    const idChanged = store.editingId !== prevEditingId.current;

    if (store.isModalOpen && (opened || idChanged)) {
      if (store.modalMode === 'edit' && store.editingId) {
        const p = products.find((prod) => prod.id === store.editingId);
        if (p) {
          setTitle(p.title);
          setSlug(p.slug);
          setPrice(p.price);
          setImageUrl(p.imageUrl);
          setUploadError(null);
          setDescription(p.description);
          setStory(p.story);
          setLimitBay(p.limitBay !== null ? String(p.limitBay) : '');
          setState(p.state as 'exist' | 'outofStock' | 'commingSoun');
          setPublishedAt(p.publishedAt ? new Date(p.publishedAt).toISOString().substring(0, 10) : '');
          setCategory(p.category);
          setVisibility(String(p.visibility ?? 0));
          setRating(String(p.rating ?? 0.0));
          setTags(p.tags || []);
          
          prevIsOpen.current = store.isModalOpen;
          prevEditingId.current = store.editingId;
        }
      } else if (store.modalMode === 'create') {
        setTitle('');
        setSlug('');
        setPrice('');
        setImageUrl('');
        setUploadError(null);
        setDescription('');
        setStory('');
        setLimitBay('');
        setState('exist');
        setPublishedAt(new Date().toISOString().substring(0, 10));
        setCategory(store.defaultCategory || 'gâteau');
        setVisibility('0');
        setRating('0.0');
        setTags([]);
        
        prevIsOpen.current = store.isModalOpen;
        prevEditingId.current = store.editingId;
      }
    }

    if (!store.isModalOpen) {
      prevIsOpen.current = false;
      prevEditingId.current = null;
    }
  }, [store.isModalOpen, store.modalMode, store.editingId, products, store.defaultCategory]);

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
      store.showToast("Veuillez attendre la fin du chargement de l'image.", "error");
      return;
    }
    if (!title || !slug || !price || !imageUrl || !description || !story) {
      store.showToast("Veuillez remplir tous les champs obligatoires.", "error");
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
  };
}
