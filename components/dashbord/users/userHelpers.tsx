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
  status: string;
}

export function getStatusBadge(status: string, isDesktop = false) {
  const paddingClass = isDesktop ? 'px-sm py-xs text-xs' : 'px-sm py-[2px] text-[10px]';
  switch (status) {
    case 'VIP':
      return (
        <span className={`inline-flex items-center gap-xs rounded-full bg-amber-500/10 ${paddingClass} font-bold text-amber-600 border border-amber-500/20`}>
          <span className="material-symbols-outlined text-xs select-none">stars</span>
          VIP
        </span>
      );
    case 'Fidèle':
      return (
        <span className={`inline-flex items-center gap-xs rounded-full bg-indigo-500/10 ${paddingClass} font-bold text-indigo-600 border border-indigo-500/20`}>
          <span className="material-symbols-outlined text-xs select-none">favorite</span>
          Fidèle
        </span>
      );
    case 'Vérifié':
      return (
        <span className={`inline-flex items-center gap-xs rounded-full bg-emerald-500/10 ${paddingClass} font-bold text-emerald-600 border border-emerald-500/20`}>
          <span className="material-symbols-outlined text-xs select-none">verified_user</span>
          Vérifié
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-xs rounded-full bg-slate-500/10 ${paddingClass} font-semibold text-slate-600 border border-slate-500/20`}>
          <span className="material-symbols-outlined text-xs select-none">pending</span>
          Non vérifié
        </span>
      );
  }
}
