import { useDashboardStore } from '@/lib/dashboard-store';
import { useDeleteProduct } from '@/lib/hooks/use-products';

export default function DeleteModal() {
  const {
    isDeleteOpen,
    setIsDeleteOpen,
    productToDelete,
  } = useDashboardStore();

  const deleteMutation = useDeleteProduct();
  const isSubmitting = deleteMutation.isPending;

  if (!isDeleteOpen) return null;

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting.";
      alert(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 className="font-display text-xl font-bold text-error flex items-center gap-xs">
            <span className="material-symbols-outlined">warning</span>
            Confirm Delete
          </h2>
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="p-md">
          <p className="text-on-surface-variant leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-on-surface">
              "{productToDelete?.title}"
            </span>
            ? This action is permanent and cannot be undone.
          </p>

          <footer className="mt-md flex justify-end gap-sm pt-md border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="rounded-lg bg-error px-md py-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-xs"
            >
              {isSubmitting && (
                <span className="material-symbols-outlined text-sm animate-spin">
                  sync
                </span>
              )}
              Delete
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
