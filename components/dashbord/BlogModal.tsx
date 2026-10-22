"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateBlogPost, useUpdateBlogPost } from '@/lib/hooks/use-blog';
import { useUploadImage } from '@/lib/hooks/use-products';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { convertToWebP } from '@/lib/image-utils';
import { slugify } from '@/lib/validations/blog';
import { BLOG_CATEGORIES } from '@/components/blog/types';

export default function BlogModal() {
  const {
    isBlogModalOpen,
    setIsBlogModalOpen,
    blogModalMode,
    editingBlogPost,
    showToast,
  } = useDashboardStore();

  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const uploadMutation = useUploadImage();

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<string>('Recettes');
  const [readingTime, setReadingTime] = useState<number>(3);
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Track if slug was manually edited by the user
  const isSlugTouched = useRef(false);

  useEffect(() => {
    if (isBlogModalOpen) {
      if (blogModalMode === 'edit' && editingBlogPost) {
        setTitle(editingBlogPost.title || '');
        setSlug(editingBlogPost.slug || '');
        setCategory(editingBlogPost.category || 'Recettes');
        setReadingTime(editingBlogPost.readingTime || 3);
        setCoverImage(editingBlogPost.coverImage || '');
        setSummary(editingBlogPost.summary || '');
        setContent(editingBlogPost.content || '');
        setIsPublished(editingBlogPost.isPublished ?? false);
        isSlugTouched.current = true;
      } else {
        // Reset form for create
        setTitle('');
        setSlug('');
        setCategory('Recettes');
        setReadingTime(3);
        setCoverImage('');
        setSummary('');
        setContent('');
        setIsPublished(false);
        isSlugTouched.current = false;
      }
      setFormError(null);
      setUploadError(null);
    }
  }, [isBlogModalOpen, blogModalMode, editingBlogPost]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugTouched.current && blogModalMode === 'create') {
      setSlug(slugify(val));
    }
  };

  const handleSlugGenerate = () => {
    if (title.trim()) {
      setSlug(slugify(title));
      isSlugTouched.current = true;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const webpBlob = await convertToWebP(file);
      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf('.');
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const webpFileName = `${baseName}.webp`;

      const webpFile = new File([webpBlob], webpFileName, { type: 'image/webp' });

      if (webpFile.size > 10 * 1024 * 1024) {
        setUploadError("La taille de l'image doit être inférieure à 10 Mo");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', webpFile);

      const data = await uploadMutation.mutateAsync(formData);
      setCoverImage(data.url);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Le titre est obligatoire');
      return;
    }
    if (!summary.trim()) {
      setFormError('Le résumé est obligatoire');
      return;
    }
    if (!content.trim()) {
      setFormError("Le contenu de l'article est obligatoire");
      return;
    }
    if (!coverImage.trim()) {
      setFormError("L'image de couverture est obligatoire");
      return;
    }

    const targetSlug = slug.trim() ? slugify(slug) : slugify(title);

    const payload = {
      title: title.trim(),
      slug: targetSlug,
      category: category.trim() || 'Recettes',
      readingTime: Number(readingTime) || 3,
      coverImage: coverImage.trim(),
      summary: summary.trim(),
      content: content.trim(),
      isPublished,
    };

    try {
      if (blogModalMode === 'create') {
        await createMutation.mutateAsync(payload);
        showToast('Article créé avec succès !', 'success');
      } else if (editingBlogPost) {
        await updateMutation.mutateAsync({
          id: editingBlogPost.id,
          payload,
        });
        showToast('Article mis à jour avec succès !', 'success');
      }
      setIsBlogModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Une erreur est survenue lors de l’enregistrement');
    }
  };

  useLockBodyScroll(isBlogModalOpen);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: isBlogModalOpen,
    onClose: () => setIsBlogModalOpen(false),
  });

  if (!isBlogModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-modal-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 animate-scale-up flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low flex-shrink-0">
          <h2 id="blog-modal-title" className="font-display text-xl font-bold text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-2xl select-none" aria-hidden="true">
              article
            </span>
            {blogModalMode === 'create' ? 'Nouvel Article de Blog' : 'Modifier l’Article'}
          </h2>
          <button
            type="button"
            onClick={() => setIsBlogModalOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-variant text-outline hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Fermer la boîte de dialogue"
          >
            <span className="material-symbols-outlined text-xl select-none" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-md md:p-lg space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                error
              </span>
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label htmlFor="blog-title" className="text-sm font-bold text-on-surface">
              Titre de l&apos;article *
            </label>
            <input
              id="blog-title"
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="Ex: Les secrets d’une pâte feuilletée croustillante"
              className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
            />
          </div>

          {/* Slug & Slug Generator */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="blog-slug" className="text-sm font-bold text-on-surface">
                Slug (identifiant URL) *
              </label>
              <button
                type="button"
                onClick={handleSlugGenerate}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm select-none" aria-hidden="true">
                  autorenew
                </span>
                <span>Générer depuis le titre</span>
              </button>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-surface-container-high text-outline text-xs rounded-l-xl border border-r-0 border-outline-variant font-mono">
                /blog/
              </span>
              <input
                id="blog-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  isSlugTouched.current = true;
                }}
                placeholder="les-secrets-d-une-pate-feuilletee"
                className="w-full h-11 px-3.5 rounded-r-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Category & Reading Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="blog-category" className="text-sm font-bold text-on-surface">
                Catégorie *
              </label>
              <select
                id="blog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              >
                {BLOG_CATEGORIES.filter((c) => c !== 'Tous').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="blog-reading-time" className="text-sm font-bold text-on-surface">
                Temps de lecture (minutes) *
              </label>
              <input
                id="blog-reading-time"
                type="number"
                min={1}
                max={60}
                required
                value={readingTime}
                onChange={(e) => setReadingTime(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Cover Image Upload & Preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface">
              Image de couverture *
            </label>

            <div className="border-2 border-dashed border-outline-variant rounded-2xl p-4 bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
              {coverImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-outline-variant/30 shadow-md">
                    <Image
                      src={coverImage}
                      alt="Aperçu couverture"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-xs text-outline font-mono truncate max-w-xs">
                      {coverImage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">
                        delete
                      </span>
                      <span>Changer l&apos;image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-2">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                      add_photo_alternate
                    </span>
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-bold text-primary hover:underline block">
                      {isUploading ? 'Téléchargement en cours...' : 'Sélectionner une image (WebP auto)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-xs text-outline mt-1">PNG, JPG, WEBP jusqu&apos;à 10 Mo</p>

                  <div className="mt-3 w-full max-w-md pt-3 border-t border-outline-variant/20">
                    <span className="text-xs text-outline block mb-1">Ou saisir une URL directe :</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface text-xs placeholder:text-outline"
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-error font-medium mt-2 text-center">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1">
            <label htmlFor="blog-summary" className="text-sm font-bold text-on-surface">
              Résumé (court extrait) *
            </label>
            <textarea
              id="blog-summary"
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Un résumé attrayant qui apparaîtra sur les cartes et dans les résultats de recherche..."
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all resize-none"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="blog-content" className="text-sm font-bold text-on-surface">
                Contenu de l&apos;article *
              </label>
              <span className="text-xs text-outline">Prend en charge le HTML ou le texte structuré</span>
            </div>
            <textarea
              id="blog-content"
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez ici le contenu complet de votre article..."
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all font-sans"
            />
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div>
              <span className="text-sm font-bold text-on-surface block">
                Statut de publication
              </span>
              <span className="text-xs text-on-surface-variant block">
                {isPublished
                  ? 'L’article sera immédiatement visible au public.'
                  : 'L’article sera enregistré en tant que brouillon.'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                {isPublished ? 'Publié' : 'Brouillon'}
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsBlogModalOpen(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors shadow-soft disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>
                {blogModalMode === 'create' ? 'Créer l’article' : 'Enregistrer les modifications'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
