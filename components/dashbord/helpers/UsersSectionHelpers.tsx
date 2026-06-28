import React from 'react';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  emailVerified: string | null;
  completedOrderCount: number;
  trustScore: number;
  latestActivity: string;
}

export function formatFrenchDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime()) || date.getTime() === 0) return '—';
  
  const day = date.getDate();
  const months = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// ============================================================================
// 1. UsersFilters
// ============================================================================

interface UsersFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  totalUsers: number;
}

export function UsersFilters({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  totalUsers,
}: UsersFiltersProps) {
  return (
    <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-xs sm:flex-row sm:items-center w-full md:w-auto flex-1 max-w-2xl">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant select-none text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-sm pl-xl pr-md text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
          />
        </div>

        <div className="flex items-center gap-xs">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface outline-none focus:border-primary h-[38px]"
          >
            <option value="trustScore">Confiance (Commandes complétées)</option>
            <option value="latestActivity">Dernière activité</option>
            <option value="email">Adresse E-mail</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface outline-none focus:border-primary h-[38px]"
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>
      <div className="text-sm text-on-surface-variant font-semibold">
        Total : {totalUsers} utilisateur(s)
      </div>
    </div>
  );
}

// ============================================================================
// 2. UsersTable
// ============================================================================

interface UsersTableProps {
  filteredUsers: User[];
  session: any;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  deleteLoading: boolean;
  onDeleteUser: (id: string) => void;
}

export function UsersTable({
  filteredUsers,
  session,
  confirmDeleteId,
  setConfirmDeleteId,
  deleteLoading,
  onDeleteUser,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
               <th className="px-lg py-md">Nom</th>
              <th className="px-lg py-md">E-mail / Téléphone</th>
              <th className="px-lg py-md">Rôle</th>
              <th className="px-lg py-md">Commandes</th>
              <th className="px-lg py-md">Score Trust</th>
              <th className="px-lg py-md">Dernière Activité</th>
              <th className="px-lg py-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-sm">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-lg py-xl text-center text-on-surface-variant">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-lg py-md font-semibold text-on-surface">
                    {user.name || 'Sans Nom'}
                  </td>
                  <td className="px-lg py-md text-on-surface-variant font-mono text-xs">
                    {user.email || user.phone || '—'}
                  </td>
                  <td className="px-lg py-md">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-xs font-bold text-primary">
                        <span className="material-symbols-outlined text-xs select-none">shield</span>
                        Administrateur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-xs text-xs font-semibold text-on-surface-variant">
                        <span className="material-symbols-outlined text-xs select-none">person</span>
                        Utilisateur
                      </span>
                    )}
                  </td>
                  <td className="px-lg py-md font-bold text-on-surface-variant">
                    {user.completedOrderCount}
                  </td>
                  <td className="px-lg py-md">
                    <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-xs text-xs font-bold text-emerald-600">
                      <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                      {user.trustScore}
                    </span>
                  </td>
                  <td className="px-lg py-md text-on-surface-variant text-xs">
                    {formatFrenchDate(user.latestActivity)}
                  </td>
                  <td className="px-lg py-md text-right">
                    {session?.user?.id === user.id ? (
                      <span className="text-xs text-on-surface-variant italic px-sm">
                        Vous (Actif)
                      </span>
                    ) : confirmDeleteId === user.id ? (
                      <div className="inline-flex items-center gap-xs">
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          disabled={deleteLoading}
                          className="rounded-full bg-error px-sm py-xs text-xs font-bold text-white hover:bg-error-container hover:text-on-error-container transition-all"
                        >
                          {deleteLoading ? '...' : 'Confirmer'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteLoading}
                          className="rounded-full border border-outline-variant bg-surface px-sm py-xs text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="inline-flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <span className="material-symbols-outlined text-lg select-none">delete</span>
                      </button>
                    )}
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
