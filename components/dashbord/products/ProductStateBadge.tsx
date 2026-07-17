import React from 'react';

export function ProductStateBadge({ state }: { state: string }) {
  const config = {
    exist: { text: 'Disponible', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-500/30' },
    outofStock: { text: 'Indisponible', style: 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-500/30' },
    commingSoun: { text: 'Bientôt', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-500/30' },
  }[state] || { text: state, style: 'bg-neutral-100 text-neutral-800 border-neutral-300' };

  return (
    <span className={`rounded-full px-sm py-[2px] text-xs font-semibold border ${config.style}`}>
      {config.text}
    </span>
  );
}
