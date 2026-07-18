import React from 'react';

interface OrdersFiltersProps {
  orderSearchQuery: string;
  setOrderSearchQuery: (v: string) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (v: string) => void;
  orderCurrentPage: number;
  setOrderCurrentPage: (v: number) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  totalOrders: number;
}

export function OrdersFilters({
  orderSearchQuery,
  setOrderSearchQuery,
  orderStatusFilter,
  setOrderStatusFilter,
  setOrderCurrentPage,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  totalOrders,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between bg-surface-container-lowest/50">
      <div className="flex flex-col gap-sm lg:flex-row lg:items-center w-full lg:w-auto flex-1 flex-wrap">
        {/* Search Bar */}
        <label className="relative w-full lg:w-80 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher des commandes..."
            value={orderSearchQuery}
            onChange={(e) => {
              setOrderSearchQuery(e.target.value);
              setOrderCurrentPage(1);
            }}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-sm pl-10 pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm w-full lg:w-auto flex-wrap">
          {/* Status Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              filter_list
            </span>
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setOrderCurrentPage(1);
              }}
              className="w-full sm:w-48 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="ACCEPTED">Acceptée</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex-grow sm:flex-initial">
            <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" translate="no">
              sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOrderCurrentPage(1);
              }}
              className="w-full sm:w-56 rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
            >
              <option value="createdAt">Trier par Date (Récentes)</option>
              <option value="status">Trier par Statut</option>
              <option value="orderCount">Trier par Volume Commandes</option>
              <option value="trustScore">Trier par Points de Confiance</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
              arrow_drop_down
            </span>
          </div>

          {/* Sort Order Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setOrderCurrentPage(1);
              }}
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
        Total des commandes : <span className="text-primary font-bold">{totalOrders}</span>
      </div>
    </div>
  );
}
