import { useDashboardStore } from '@/lib/dashboard-store';
import { useArchiveProduct } from '@/lib/hooks/use-products';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

export default function DeleteModal() {
  const {
    isDeleteOpen,
    setIsDeleteOpen,
    productToDelete,
    showToast,
  } = useDashboardStore();

  const archiveMutation = useArchiveProduct();
  const isSubmitting = archiveMutation.isPending;

  useLockBodyScroll(isDeleteOpen);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: isDeleteOpen,
    onClose: () => setIsDeleteOpen(false),
  });

  if (!isDeleteOpen) return null;

  const isAlreadyArchived =
    productToDelete?.state === 'archived' || productToDelete?.isPublished === false;

  const handleArchiveConfirm = async () => {
    if (!productToDelete) return;
    try {
      if (isAlreadyArchived) {
        await archiveMutation.mutateAsync({
          id: productToDelete.id,
          isPublished: true,
          state: 'exist',
        });
        setIsDeleteOpen(false);
        showToast('Produit réactivé avec succès !', 'success');
      } else {
        await archiveMutation.mutateAsync({
          id: productToDelete.id,
          isPublished: false,
          state: 'archived',
        });
        setIsDeleteOpen(false);
        showToast('Produit archivé avec succès !', 'success');
      }
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'archivage.";
      showToast(errMsg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up"
      >
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2
            id="delete-modal-title"
            className="font-display text-xl font-bold text-amber-700 dark:text-amber-400 flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-2xl text-amber-600">
              {isAlreadyArchived ? 'unarchive' : 'inventory_2'}
            </span>
            {isAlreadyArchived ? 'Confirmer la réactivation' : "Confirmer l'archivage"}
          </h2>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(false)}
            aria-label="Fermer la boîte de dialogue"
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-md">
          <p className="text-on-surface-variant leading-relaxed">
            {isAlreadyArchived ? (
              <>
                Voulez-vous réactiver le produit{' '}
                <span className="font-bold text-on-surface">
                  « {productToDelete?.title} »
                </span>{' '}
                pour le rendre à nouveau visible et disponible à la commande dans la boutique ?
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir archiver / désactiver{' '}
                <span className="font-bold text-on-surface">
                  « {productToDelete?.title} »
                </span>{' '}
                ? Le produit ne sera plus affiché dans la boutique publique et ne pourra plus être commandé, tout en préservant l'historique des commandes existantes.
              </>
            )}
          </p>

          <footer className="mt-md flex justify-end gap-sm pt-md border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleArchiveConfirm}
              disabled={isSubmitting}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 px-md py-sm font-semibold text-white disabled:opacity-60 flex items-center gap-xs shadow-sm transition-colors"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              {isAlreadyArchived ? 'Réactiver' : 'Archiver'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

