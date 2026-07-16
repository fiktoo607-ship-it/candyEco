import { useDashboardStore } from '@/lib/dashboard-store';
import { useDeleteProduct } from '@/lib/hooks/use-products';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';

export default function DeleteModal() {
  const {
    isDeleteOpen,
    setIsDeleteOpen,
    productToDelete,
    showToast,
  } = useDashboardStore();

  const deleteMutation = useDeleteProduct();
  const isSubmitting = deleteMutation.isPending;

  useLockBodyScroll(isDeleteOpen);

  if (!isDeleteOpen) return null;

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setIsDeleteOpen(false);
      showToast("Produit supprimé avec succès !", "success");
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la suppression.";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 className="font-display text-xl font-bold text-error flex items-center gap-xs">
            <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Confirmer la suppression
          </h2>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(false)}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-md">
          <p className="text-on-surface-variant leading-relaxed">
            Êtes-vous sûr de vouloir supprimer{" "}
            <span className="font-bold text-on-surface">
              « {productToDelete?.title} »
            </span>
             ? Cette action est permanente et ne peut pas être annulée.
          </p>

          <footer className="mt-md flex justify-end gap-sm pt-md border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="rounded-lg bg-error px-md py-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-xs"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              Supprimer
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
