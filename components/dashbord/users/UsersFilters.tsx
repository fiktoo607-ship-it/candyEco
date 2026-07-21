import React from 'react';

interface UsersFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  totalUsers: number;
  onOpenFidelityModal?: () => void;
}

export function UsersFilters({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  totalUsers,
  onOpenFidelityModal,
}: UsersFiltersProps) {
  return (
    <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between bg-surface-container-lowest/50 p-md rounded-2xl border border-outline-variant/10 shadow-soft">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto flex-1 flex-wrap">
        {/* Search Bar */}
        <label className="relative w-full lg:w-72 flex-shrink-0">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm w-full lg:w-auto flex-wrap">
          {/* Sort By Dropdown */}
          <div className="relative flex-grow sm:flex-initial">
            <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" translate="no">
              sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="trustScore">Points de Confiance</option>
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
              className="w-full sm:w-32 rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Update Fidelity Button (Outside Table) */}
          {onOpenFidelityModal && (
            <button
              type="button"
              onClick={onOpenFidelityModal}
              className="inline-flex items-center justify-center gap-xs rounded-xl bg-amber-500/10 border border-amber-500/30 px-md py-sm text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all h-[46px] shadow-soft cursor-pointer active:scale-95"
              title="Mettre à jour les seuils de fidélité ou le statut d'un client"
            >
              <span className="material-symbols-outlined text-base">stars</span>
              <span>Mise à jour fidélité</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-on-surface-variant font-medium flex-shrink-0 mt-sm lg:mt-0 lg:text-right border-t border-outline-variant/10 pt-sm lg:border-t-0 lg:pt-0">
        Total : <span className="text-primary font-bold">{totalUsers}</span> client(s)
      </div>
    </div>
  );
}
