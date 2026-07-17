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
      <label className="text-sm font-bold text-on-surface-variant">
        Score de visibilité
      </label>
      <input
        type="number"
        placeholder="Ex: 10"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
