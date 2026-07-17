import React from 'react';

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
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto flex-1 flex-wrap">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm w-full lg:w-auto flex-wrap">
          {/* Sort By Dropdown */}
          <div className="relative flex-grow sm:flex-initial">
            <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" translate="no">
              sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
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
        Total : <span className="text-primary font-bold">{totalUsers}</span> client(s)
      </div>
    </div>
  );
}
