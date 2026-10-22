"use client";

import { useDashboardStore } from '@/lib/dashboard-store';
import { useDeleteBlogPost } from '@/lib/hooks/use-blog';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

export default function BlogDeleteModal() {
  const {
    isBlogDeleteOpen,
    setIsBlogDeleteOpen,
    blogToDelete,
    showToast,
  } = useDashboardStore();

  const deleteMutation = useDeleteBlogPost();
  const isSubmitting = deleteMutation.isPending;

  useLockBodyScroll(isBlogDeleteOpen);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: isBlogDeleteOpen,
    onClose: () => setIsBlogDeleteOpen(false),
  });

  if (!isBlogDeleteOpen) return null;

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;
    try {
      await deleteMutation.mutateAsync(blogToDelete.id);
      setIsBlogDeleteOpen(false);
      showToast('Article supprimé avec succès !', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Une erreur est survenue lors de la suppression.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-blog-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 animate-scale-up"
      >
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 id="delete-blog-title" className="font-display text-lg font-bold text-error flex items-center gap-xs">
            <span className="material-symbols-outlined text-xl select-none" aria-hidden="true">
              warning
            </span>
            <span>Supprimer l&apos;article</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsBlogDeleteOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-variant text-outline hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Fermer la boîte de dialogue"
          >
            <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
              close
            </span>
          </button>
        </header>

        <div className="p-md md:p-lg space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement l&apos;article{' '}
            <strong className="text-on-surface font-bold">&quot;{blogToDelete?.title}&quot;</strong> ?
          </p>
          <p className="text-xs text-error font-medium bg-error/10 p-3 rounded-xl border border-error/20">
            ⚠️ Cette action est irréversible et retirera cet article du blog public.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsBlogDeleteOpen(false)}
              className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="px-5 py-2 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-soft"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>Supprimer définitivement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
