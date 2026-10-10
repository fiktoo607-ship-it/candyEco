import React from 'react';

interface ProductDetailsInfoProps {
  limitBay: string;
  setLimitBay: (v: string) => void;
  state: string;
  setState: (v: 'exist' | 'outofStock' | 'commingSoun') => void;
}

export function ProductDetailsInfo({
  limitBay,
  setLimitBay,
  state,
  setState,
}: ProductDetailsInfoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          Quantité minimum par commande
        </label>
        <input
          type="number"
          placeholder="Ex: 5"
          value={limitBay}
          onChange={(e) => setLimitBay(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          État *
        </label>
        <div className="relative">
          <select
            value={state}
            onChange={(e) => setState(e.target.value as 'exist' | 'outofStock' | 'commingSoun')}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-sm pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-[46px] appearance-none cursor-pointer"
          >
            <option value="exist">Disponible</option>
            <option value="outofStock">Indisponible</option>
            <option value="commingSoun">Bientôt</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
            arrow_drop_down
          </span>
        </div>
      </div>
    </div>
  );
}
