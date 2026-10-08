"use client";

import React, { useState, useEffect } from 'react';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useDashboardStore } from '@/lib/dashboard-store';
import { User } from './userHelpers';

interface FidelityConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onUpdateUserStatus: (id: string, newStatus: string, newScore?: number) => void;
  onRefreshUsers: () => void;
}

export function FidelityConfigModal({
  isOpen,
  onClose,
  users,
  onUpdateUserStatus,
  onRefreshUsers,
}: FidelityConfigModalProps) {
  useLockBodyScroll(isOpen);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });
  const { showToast } = useDashboardStore();

  const [vipThreshold, setVipThreshold] = useState<string>('500');
  const [fideleThreshold, setFideleThreshold] = useState<string>('100');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Individual client modification state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [customStatus, setCustomStatus] = useState<string>('VIP');
  const [customPoints, setCustomPoints] = useState<string>('500');
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchConfig = async () => {
        try {
          setLoadingConfig(true);
          const res = await fetch('/api/fidelity-config');
          if (res.ok) {
            const data = await res.json();
            setVipThreshold(String(data.vipThreshold ?? 500));
            setFideleThreshold(String(data.fideleThreshold ?? 100));
          }
        } catch (err) {
          console.error('Failed to load fidelity config:', err);
        } finally {
          setLoadingConfig(false);
        }
      };
      fetchConfig();
    }
  }, [isOpen]);

  // Sync selected user details when user changes
  useEffect(() => {
    if (selectedUserId) {
      const targetUser = users.find((u) => u.id === selectedUserId);
      if (targetUser) {
        setCustomStatus(targetUser.status || 'VIP');
        setCustomPoints(String(targetUser.trustScore ?? 0));
      }
    }
  }, [selectedUserId, users]);

  if (!isOpen) return null;

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const parsedVip = parseInt(vipThreshold) || 500;
      const parsedFidele = parseInt(fideleThreshold) || 100;

      const res = await fetch('/api/fidelity-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vipThreshold: parsedVip,
          fideleThreshold: parsedFidele,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement.');
      }

      showToast("Seuils de fidélité mis à jour avec succès !", "success");
      onRefreshUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau.';
      showToast(msg, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApplyUserStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast("Veuillez sélectionner un client.", "error");
      return;
    }
    try {
      setSavingUser(true);
      const parsedScore = parseInt(customPoints) || 0;
      await onUpdateUserStatus(selectedUserId, customStatus, parsedScore);
      onRefreshUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fidelity-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 animate-scale-up flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low flex-shrink-0">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-amber-500 text-xl select-none">stars</span>
            <h2 id="fidelity-modal-title" className="font-display text-lg font-bold text-on-surface">Mise à jour de la fidélité</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Modal Content Body */}
        <div className="p-md space-y-md overflow-y-auto flex-grow">
          {/* Section 1: Global Thresholds */}
          <form onSubmit={handleSaveThresholds} className="space-y-sm bg-surface-container-low/40 p-md rounded-2xl border border-outline-variant/10">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-base">tune</span>
                Seuils Globaux des Statuts (Points p)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-xs">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-xs">
                  Seuil VIP (ex: 700 p)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="700"
                    value={vipThreshold}
                    onChange={(e) => setVipThreshold(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-sm font-bold text-on-surface outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">p</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-xs">
                  Seuil Fidèle (ex: 200 p)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="200"
                    value={fideleThreshold}
                    onChange={(e) => setFideleThreshold(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-sm font-bold text-on-surface outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600">p</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-xs">
              <button
                type="submit"
                disabled={savingConfig || loadingConfig}
                className="rounded-xl bg-primary px-md py-xs text-xs font-bold text-white hover:bg-surface-tint transition-all disabled:opacity-50 flex items-center gap-xs shadow-soft"
              >
                {savingConfig && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                Enregistrer les seuils
              </button>
            </div>
          </form>

          {/* Section 2: Individual Client Update */}
          <form onSubmit={handleApplyUserStatus} className="space-y-sm bg-surface-container-low/40 p-md rounded-2xl border border-outline-variant/10">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-base">person_edit</span>
                Modifier un Client Particulier
              </h3>
            </div>

            <div className="space-y-xs pt-xs">
              <label className="block text-xs font-bold text-on-surface-variant mb-xs">
                Sélectionner un Client
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- Choisir un client --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email || u.phone || u.id} ({u.status || 'Non vérifié'} : {u.trustScore} p)
                  </option>
                ))}
              </select>
            </div>

            {selectedUserId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-xs animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-xs">
                    Nouveau Statut
                  </label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Fidèle">Fidèle</option>
                    <option value="Vérifié">Vérifié</option>
                    <option value="Non vérifié">Non vérifié</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-xs">
                    Points (p)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={customPoints}
                      onChange={(e) => setCustomPoints(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-sm font-bold text-on-surface outline-none focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">p</span>
                  </div>
                </div>
              </div>
            )}

            {selectedUserId && (
              <div className="flex justify-end pt-xs">
                <button
                  type="submit"
                  disabled={savingUser}
                  className="rounded-xl bg-emerald-600 px-md py-xs text-xs font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-xs shadow-soft"
                >
                  {savingUser && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                  Mettre à jour le client
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <footer className="flex justify-end border-t border-outline-variant/20 px-md py-sm bg-surface-container-low flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant bg-surface px-md py-xs text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
