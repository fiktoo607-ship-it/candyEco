import React from 'react';
import PriceDisplay from '@/components/PriceDisplay';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
}

// ============================================================================
// 1. DeliveryForm
// ============================================================================

interface DeliveryFormProps {
  isEditing: boolean;
  submitError: string | null;
  submitLoading: boolean;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function DeliveryForm({
  isEditing,
  submitError,
  submitLoading,
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  active,
  setActive,
  onSubmit,
  onCancel,
}: DeliveryFormProps) {
  useLockBodyScroll(true);

  return (
    <form onSubmit={onSubmit} className="p-md flex flex-col gap-sm overflow-y-auto flex-grow">
      {submitError && (
        <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-xs font-medium text-error mb-sm flex items-start gap-xs">
          <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
          <span>{submitError}</span>
        </div>
      )}

      <div className="space-y-sm">
        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            Nom de la méthode (ex: Home Delivery, Store Pickup)
          </label>
          <input
            type="text"
            required
            placeholder="Nom de la méthode..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            Description
          </label>
          <textarea
            placeholder="Description (ex: Livraison à votre bureau)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            Prix additionnel (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="pt-xs">
          <label
            htmlFor="active"
            className={`flex items-center gap-sm p-sm rounded-xl border transition-all cursor-pointer select-none ${
              active
                ? 'bg-primary-container/10 border-primary/30 text-on-surface'
                : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
            }`}
          >
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold">
              Activer cette méthode de livraison
            </span>
          </label>
        </div>
      </div>

      <footer className="mt-md flex justify-end gap-sm border-t border-outline-variant/20 pt-md mt-auto flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-outline-variant bg-surface px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitLoading}
          className="rounded-xl bg-primary px-md py-sm text-sm font-bold text-white hover:bg-surface-tint transition-all disabled:opacity-60 flex items-center justify-center gap-xs shadow-soft"
        >
          {submitLoading ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">save</span>
          )}
          {isEditing ? 'Sauvegarder' : 'Créer'}
        </button>
      </footer>
    </form>
  );
}

// ============================================================================
// 2. DeliveryTable
// ============================================================================

interface DeliveryTableProps {
  methods: DeliveryMethod[];
  onToggleActive: (method: DeliveryMethod) => void;
  onEdit: (method: DeliveryMethod) => void;
  onDelete: (id: string) => void;
}

export function DeliveryTable({
  methods,
  onToggleActive,
  onEdit,
  onDelete,
}: DeliveryTableProps) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest overflow-hidden flex flex-col justify-between">
      {/* Mobile/Tablet Card Grid Layout (< 1024px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md p-md lg:hidden bg-surface/20">
        {methods.length === 0 ? (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-medium">
            Aucune méthode de livraison configurée.
          </div>
        ) : (
          methods.map((method) => (
            <div key={method.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
              <div className="space-y-sm">
                <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                  <h3 className="font-bold text-on-surface text-base">{method.name}</h3>
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      onClick={() => onToggleActive(method)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-[2px] transition-all duration-200 ease-in-out focus:outline-none border ${
                        method.active
                          ? 'bg-[#161a17] border-[#94b59b]'
                          : 'bg-[#181818] border-neutral-600/70'
                      }`}
                      role="switch"
                      aria-checked={method.active}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full transition-all duration-200 ease-in-out ${
                          method.active
                            ? 'translate-x-5 bg-[#94b59b]'
                            : 'translate-x-0 bg-neutral-500'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${method.active ? 'text-[#94b59b]' : 'text-neutral-500'}`}>
                      {method.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">{method.description || 'Aucune description'}</p>
              </div>

              <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant font-medium">Prix additionnel</span>
                   <span className="text-sm font-bold text-primary"><PriceDisplay price={method.price} /></span>
                </div>

                <div className="flex items-center justify-end gap-xs">
                  <button
                    onClick={() => onEdit(method)}
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(method.id)}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-sm py-xs text-xs font-bold text-error hover:bg-rose-500/10 transition-colors flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Grid Layout (>= 1024px) */}
      <div className="overflow-x-auto lg:block hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <th className="px-lg py-md">Nom</th>
              <th className="px-lg py-md">Description</th>
              <th className="px-lg py-md">Prix</th>
              <th className="px-lg py-md">Statut</th>
              <th className="px-lg py-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {methods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant font-medium bg-surface/10 animate-pulse">
                  Aucune méthode de livraison configurée.
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr key={method.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-lg py-md font-semibold text-on-surface">
                    {method.name}
                  </td>
                  <td className="px-lg py-md text-on-surface-variant max-w-[200px] truncate" title={method.description || undefined}>
                    {method.description || '—'}
                  </td>
                   <td className="px-lg py-md font-bold text-primary">
                    <PriceDisplay price={method.price} />
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-xs">
                      <button
                        type="button"
                        onClick={() => onToggleActive(method)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-[2px] transition-all duration-200 ease-in-out focus:outline-none border ${
                          method.active
                            ? 'bg-[#161a17] border-[#94b59b]'
                            : 'bg-[#181818] border-neutral-600/70'
                        }`}
                        role="switch"
                        aria-checked={method.active}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full transition-all duration-200 ease-in-out ${
                            method.active
                              ? 'translate-x-5 bg-[#94b59b]'
                              : 'translate-x-0 bg-neutral-500'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold ${method.active ? 'text-[#94b59b]' : 'text-neutral-500'}`}>
                        {method.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(method)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors mr-xs"
                      title="Modifier"
                    >
                      <span className="material-symbols-outlined text-lg select-none">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(method.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/20 text-on-surface-variant hover:text-error hover:bg-rose-500/5 transition-colors"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-lg select-none">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
