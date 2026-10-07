import React, { useState } from 'react';
import PriceDisplay from '@/components/PriceDisplay';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  homePrice?: number;
  stockPrice?: number;
  active: boolean;
}

// ============================================================================
// StatusToggle Component
// ============================================================================

interface StatusToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function StatusToggle({ active, onToggle }: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      className="inline-flex items-center gap-2 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full group active:scale-95 transition-transform"
      title={active ? 'Actif - Cliquer pour désactiver' : 'Inactif - Cliquer pour activer'}
    >
      <span
        style={{
          width: '50px',
          height: '26px',
          backgroundColor: active ? '#30048d' : '#64748b',
          borderRadius: '9999px',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'background-color 0.3s ease',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          border: active ? '1.5px solid #30048d' : '1.5px solid #475569',
        }}
      >
        <span
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '1.5px',
            left: active ? '26px' : '2px',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: active ? '#30048d' : '#94a3b8',
              transition: 'background-color 0.3s ease',
            }}
          />
        </span>
      </span>

      <span
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: active ? '#30048d' : '#64748b',
          transition: 'color 0.3s ease',
        }}
      >
        {active ? 'Actif' : 'Inactif'}
      </span>
    </button>
  );
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
  homePrice: string;
  setHomePrice: (v: string) => void;
  stockPrice: string;
  setStockPrice: (v: string) => void;
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
  homePrice,
  setHomePrice,
  stockPrice,
  setStockPrice,
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
            Nom de la méthode (ex: World Express, Yalidin)
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
            placeholder="Description (ex: Livraison express)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-xs">
              Prix à domicile (€) (Home)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={homePrice}
              onChange={(e) => {
                setHomePrice(e.target.value);
                setPrice(e.target.value);
              }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-xs">
              Prix au stock / bureau (€) (Stock)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={stockPrice}
              onChange={(e) => setStockPrice(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="pt-xs">
          <label
            htmlFor="active"
            className={`flex items-center gap-sm p-sm rounded-xl border transition-all cursor-pointer select-none ${
              active
                ? 'bg-emerald-500/10 border-emerald-500/30 text-on-surface'
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
  onEditLieuPrice?: (method: DeliveryMethod) => void;
}

export function DeliveryTable({
  methods,
  onToggleActive,
  onEdit,
  onDelete,
  onEditLieuPrice,
}: DeliveryTableProps) {
  // Store selected place ("home" | "stock") per delivery method ID
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, 'home' | 'stock'>>({});

  const getMethodPrice = (method: DeliveryMethod) => {
    const place = selectedPlaces[method.id] || 'home';
    if (place === 'stock') {
      return method.stockPrice ?? method.price;
    }
    return method.homePrice ?? method.price;
  };

  return (
    <div className="rounded-2xl bg-surface-container-lowest overflow-hidden flex flex-col justify-between">
      {/* Mobile/Tablet Card Grid Layout (< 1024px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md p-md lg:hidden bg-surface/20">
        {methods.length === 0 ? (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-medium">
            Aucune méthode de livraison configurée.
          </div>
        ) : (
          methods.map((method) => {
            const currentPlace = selectedPlaces[method.id] || 'home';
            return (
              <div key={method.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
                <div className="space-y-sm">
                  <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                    <h3 className="font-bold text-on-surface text-base">{method.name}</h3>
                    <StatusToggle
                      active={method.active}
                      onToggle={() => onToggleActive(method)}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">{method.description || 'Aucune description'}</p>
                </div>

                <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                  <div className="flex items-center justify-between gap-xs">
                    <label className="text-xs text-on-surface-variant font-medium">Lieu de livraison:</label>
                    <select
                      value={currentPlace}
                      onChange={(e) => setSelectedPlaces(prev => ({ ...prev, [method.id]: e.target.value as 'home' | 'stock' }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface outline-none focus:border-primary"
                    >
                      <option value="home">Domicile (Home)</option>
                      <option value="stock">Stock / Bureau</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant font-medium">Prix ({currentPlace === 'home' ? 'Domicile' : 'Stock'})</span>
                    <div className="flex items-center gap-xs">
                      <span className="text-sm font-bold text-primary"><PriceDisplay price={getMethodPrice(method)} /></span>
                      {onEditLieuPrice && (
                        <button
                          type="button"
                          onClick={() => onEditLieuPrice(method)}
                          className="inline-flex items-center justify-center h-6 w-6 rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Modifier les prix par lieu"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      )}
                    </div>
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
            );
          })
        )}
      </div>

      {/* Desktop Grid Layout (>= 1024px) */}
      <div className="overflow-x-auto lg:block hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <th className="px-lg py-md">Nom</th>
              <th className="px-lg py-md">Description</th>
              <th className="px-lg py-md">Lieu</th>
              <th className="px-lg py-md">Prix</th>
              <th className="px-lg py-md">Statut</th>
              <th className="px-lg py-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {methods.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant font-medium bg-surface/10 animate-pulse">
                  Aucune méthode de livraison configurée.
                </td>
              </tr>
            ) : (
              methods.map((method) => {
                const currentPlace = selectedPlaces[method.id] || 'home';
                return (
                  <tr key={method.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-lg py-md font-semibold text-on-surface">
                      {method.name}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant max-w-[200px] truncate" title={method.description || undefined}>
                      {method.description || '—'}
                    </td>
                    <td className="px-lg py-md">
                      <select
                        value={currentPlace}
                        onChange={(e) => setSelectedPlaces(prev => ({ ...prev, [method.id]: e.target.value as 'home' | 'stock' }))}
                        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface outline-none focus:border-primary"
                      >
                        <option value="home">Domicile (Home)</option>
                        <option value="stock">Stock / Bureau</option>
                      </select>
                    </td>
                    <td className="px-lg py-md font-bold text-primary">
                      <div className="flex items-center gap-xs">
                        <PriceDisplay price={getMethodPrice(method)} />
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 px-1.5 py-0.5 rounded bg-surface-container-high">
                          {currentPlace === 'home' ? 'Home' : 'Stock'}
                        </span>
                        {onEditLieuPrice && (
                          <button
                            type="button"
                            onClick={() => onEditLieuPrice(method)}
                            className="inline-flex items-center justify-center h-6 w-6 rounded text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100"
                            title="Modifier les prix par lieu"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <StatusToggle
                        active={method.active}
                        onToggle={() => onToggleActive(method)}
                      />
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 3. LieuPriceModal Component
// ============================================================================

interface LieuPriceModalProps {
  isOpen: boolean;
  method: DeliveryMethod | null;
  homePrice: string;
  setHomePrice: (v: string) => void;
  stockPrice: string;
  setStockPrice: (v: string) => void;
  submitLoading: boolean;
  submitError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function LieuPriceModal({
  isOpen,
  method,
  homePrice,
  setHomePrice,
  stockPrice,
  setStockPrice,
  submitLoading,
  submitError,
  onSubmit,
  onClose,
}: LieuPriceModalProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen || !method) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up flex flex-col">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface leading-snug">
                Modifier les prix par Lieu
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {method.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <form onSubmit={onSubmit} className="p-md space-y-md">
          {submitError && (
            <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-xs font-medium text-error flex items-start gap-xs">
              <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-sm">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-xs uppercase tracking-wider">
                Prix à domicile (Home) (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={homePrice}
                  onChange={(e) => setHomePrice(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base font-semibold text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-xs uppercase tracking-wider">
                Prix au stock / bureau (Stock) (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base font-semibold text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">€</span>
              </div>
            </div>
          </div>

          <footer className="flex justify-end gap-sm border-t border-outline-variant/20 pt-md">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant bg-surface px-md py-sm text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="rounded-xl bg-primary px-md py-sm text-xs font-bold text-white hover:bg-surface-tint transition-all disabled:opacity-60 flex items-center justify-center gap-xs shadow-soft"
            >
              {submitLoading ? (
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-sm">save</span>
              )}
              Enregistrer
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

