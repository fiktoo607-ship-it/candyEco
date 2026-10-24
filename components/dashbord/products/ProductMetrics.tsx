import React from 'react';

interface ProductMetricsProps {
  visibility: string;
  setVisibility: (v: string) => void;
}

export function ProductMetrics({
  visibility,
  setVisibility,
}: ProductMetricsProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor="product-visibility" className="text-sm font-bold text-on-surface-variant">
        Score de visibilité
      </label>
      <input
        id="product-visibility"
        type="number"
        placeholder="Ex: 10"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary"
      />
    </div>
  );
}
