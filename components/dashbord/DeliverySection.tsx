"use client";

import { useEffect, useState } from 'react';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
}

export default function DeliverySection() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.0');
  const [active, setActive] = useState(true);
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery-methods');
      if (!res.ok) {
        throw new Error('Impossible de charger les méthodes de livraison.');
      }
      const data = await res.json();
      setMethods(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('0.0');
    setActive(true);
    setSubmitError(null);
  };

  const handleEditClick = (method: DeliveryMethod) => {
    setIsEditing(true);
    setEditingId(method.id);
    setName(method.name);
    setDescription(method.description || '');
    setPrice(String(method.price));
    setActive(method.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setSubmitError('Le nom est requis.');
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError(null);

      const url = isEditing && editingId 
        ? `/api/delivery-methods/${editingId}`
        : '/api/delivery-methods';
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          price: parseFloat(price) || 0.0,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l’enregistrement.');
      }

      resetForm();
      fetchMethods();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (method: DeliveryMethod) => {
    try {
      const res = await fetch(`/api/delivery-methods/${method.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !method.active,
        }),
      });
      if (res.ok) {
        fetchMethods();
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette méthode de livraison ?')) return;

    try {
      const res = await fetch(`/api/delivery-methods/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMethods();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      console.error('Error deleting method:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement des modes de livraison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-error-container/20 border border-error/20 p-md text-center text-error">
        <span className="material-symbols-outlined text-3xl mb-xs block select-none">warning</span>
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-md lg:grid-cols-3 animate-fade-in">
      {/* Form Card */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft h-fit lg:col-span-1">
        <h2 className="text-lg font-bold text-on-surface mb-md">
          {isEditing ? 'Modifier la méthode' : 'Créer une méthode de livraison'}
        </h2>

        {submitError && (
          <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-xs font-medium text-error mb-sm flex items-start gap-xs">
            <span className="material-symbols-outlined text-base select-none shrink-0">error</span>
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-sm">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-xs">
              Nom de la méthode (ex: Home Delivery, Store Pickup)
            </label>
            <input
              type="text"
              required
              placeholder="Nom..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-xs">
              Description
            </label>
            <textarea
              placeholder="Description (ex: Livraison à votre bureau)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-sm text-on-surface outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-xs">
              Prix additionnel ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-sm pt-xs">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="active" className="text-sm font-semibold text-on-surface select-none">
              Activer cette méthode de livraison
            </label>
          </div>

          <div className="flex gap-xs pt-md">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 rounded-xl bg-primary py-sm text-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint flex items-center justify-center gap-xs"
            >
              {submitLoading && (
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              )}
              {isEditing ? 'Sauvegarder' : 'Créer'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-outline-variant bg-surface px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft lg:col-span-2 overflow-hidden">
        <div className="overflow-x-auto">
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
                  <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">
                    Aucune méthode de livraison configurée.
                  </td>
                </tr>
              ) : (
                methods.map((method) => (
                  <tr key={method.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-lg py-md font-semibold text-on-surface">
                      {method.name}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant max-w-[200px] truncate" title={method.description || undefined}>
                      {method.description || '—'}
                    </td>
                    <td className="px-lg py-md font-semibold text-primary">
                      ${method.price.toFixed(2)}
                    </td>
                    <td className="px-lg py-md">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-xs font-bold transition-all ${
                          method.active
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs select-none">
                          {method.active ? 'check_circle' : 'cancel'}
                        </span>
                        {method.active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-lg py-md text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(method)}
                        className="inline-flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors mr-xs"
                        title="Modifier"
                      >
                        <span className="material-symbols-outlined text-lg select-none">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="inline-flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
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
    </div>
  );
}
