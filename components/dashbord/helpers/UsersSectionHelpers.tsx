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
    <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between bg-surface-container-lowest/50 p-md rounded-2xl border border-outline-variant/10 shadow-soft">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto flex-1">
        {/* Search Bar */}
        <label className="relative w-full lg:w-80 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-sm pl-10 pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm w-full lg:w-auto">
          {/* Sort By Dropdown */}
          <div className="relative flex-grow sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="trustScore">Confiance (Commandes complétées)</option>
              <option value="latestActivity">Dernière activité</option>
              <option value="email">Adresse E-mail</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Sort Order Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full sm:w-36 rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-on-surface-variant font-medium flex-shrink-0 mt-sm lg:mt-0 lg:text-right border-t border-outline-variant/10 pt-sm lg:border-t-0 lg:pt-0">
        Total : <span className="text-primary font-bold">{totalUsers}</span> utilisateur(s)
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
      {/* Mobile/Tablet Card Grid Layout (< 1024px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-md lg:hidden bg-surface/20">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-medium">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const initials = (user.name || 'S N')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={user.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
                <div className="space-y-sm">
                  {/* Card Header Profile */}
                  <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                    <div className="flex items-center gap-sm">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-sm leading-normal">{user.name || 'Sans Nom'}</h3>
                        <span className="text-xs text-on-surface-variant/80">ID: {user.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-[2px] text-[10px] font-bold text-primary border border-primary/20">
                          <span className="material-symbols-outlined text-xs select-none">shield</span>
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-[2px] text-[10px] font-semibold text-on-surface-variant border border-outline-variant/30">
                          <span className="material-symbols-outlined text-xs select-none">person</span>
                          Client
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-xs">
                    {(user.email || user.phone) && (
                      <div className="flex items-start gap-xs text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-base mt-[1px]">mail</span>
                        <span className="font-mono">{user.email || user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-xs text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-base mt-[1px]">history</span>
                      <span>Activité: {formatFrenchDate(user.latestActivity)}</span>
                    </div>
                  </div>

                  {/* User Stats Grid */}
                  <div className="grid grid-cols-2 gap-sm bg-surface-container-low/55 p-sm rounded-xl border border-outline-variant/10">
                    <div className="text-center border-r border-outline-variant/10">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider">Commandes</span>
                      <span className="text-sm font-bold text-on-surface">{user.completedOrderCount}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider">Confiance</span>
                      <span className="inline-flex items-center gap-[2px] text-xs font-bold text-emerald-600 mt-[2px]">
                        <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                        {user.trustScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                  <div className="flex items-center justify-end gap-sm w-full">
                    {session?.user?.id === user.id ? (
                      <span className="text-xs text-on-surface-variant italic px-sm font-semibold">
                        Vous (Actif)
                      </span>
                    ) : confirmDeleteId === user.id ? (
                      <div className="inline-flex items-center gap-xs w-full">
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          disabled={deleteLoading}
                          className="flex-grow rounded-xl bg-error px-sm py-[8px] text-xs font-bold text-white hover:bg-error-container hover:text-on-error-container transition-all flex items-center justify-center gap-xs shadow-soft"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteLoading}
                          className="flex-grow rounded-xl border border-outline-variant bg-surface px-sm py-[8px] text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center justify-center gap-xs"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-sm py-[8px] text-xs font-bold text-error hover:bg-rose-500/10 transition-colors flex items-center gap-xs"
                        title="Supprimer l'utilisateur"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Grid Layout (>= 1024px) */}
      <div className="overflow-x-auto lg:block hidden">
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
                <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-lg py-md font-semibold text-on-surface">
                    {user.name || 'Sans Nom'}
                  </td>
                  <td className="px-lg py-md text-on-surface-variant font-mono text-xs">
                    {user.email || user.phone || '—'}
                  </td>
                  <td className="px-lg py-md">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-xs font-bold text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-xs select-none">shield</span>
                        Administrateur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-xs text-xs font-semibold text-on-surface-variant border border-outline-variant/30">
                        <span className="material-symbols-outlined text-xs select-none">person</span>
                        Utilisateur
                      </span>
                    )}
                  </td>
                  <td className="px-lg py-md font-bold text-on-surface-variant">
                    {user.completedOrderCount}
                  </td>
                  <td className="px-lg py-md">
                    <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-xs text-xs font-bold text-emerald-600 border border-emerald-500/20">
                      <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                      {user.trustScore}
                    </span>
                  </td>
                  <td className="px-lg py-md text-on-surface-variant text-xs font-medium">
                    {formatFrenchDate(user.latestActivity)}
                  </td>
                  <td className="px-lg py-md text-right">
                    {session?.user?.id === user.id ? (
                      <span className="text-xs text-on-surface-variant italic px-sm font-semibold">
                        Vous (Actif)
                      </span>
                    ) : confirmDeleteId === user.id ? (
                      <div className="inline-flex items-center gap-xs">
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          disabled={deleteLoading}
                          className="rounded-xl bg-error px-sm py-xs text-xs font-bold text-white hover:bg-error-container hover:text-on-error-container transition-all shadow-soft h-[34px] flex items-center justify-center"
                        >
                          {deleteLoading ? '...' : 'Confirmer'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteLoading}
                          className="rounded-xl border border-outline-variant bg-surface px-sm py-xs text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-all h-[34px] flex items-center justify-center"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/20 text-on-surface-variant hover:text-error hover:bg-rose-500/5 transition-colors"
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
