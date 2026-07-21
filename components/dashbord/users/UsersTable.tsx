import React from 'react';
import { formatFrenchDate } from '@/lib/date';
import { User, getStatusBadge } from './userHelpers';

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
            Aucun client trouvé.
          </div>
        ) : (
          filteredUsers.map((user) => {
            return (
              <div key={user.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
                <div className="space-y-sm">
                  {/* Card Header Profile */}
                  <div className="flex items-center justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                    <div className="flex-1">
                      <h3 className="font-bold text-on-surface text-sm leading-normal">{user.name || 'Sans Nom'}</h3>
                      <span className="text-xs text-on-surface-variant/80">ID: {user.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(user.status)}
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
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider">Points</span>
                      <span className="inline-flex items-center gap-[2px] text-xs font-bold text-emerald-600 mt-[2px] whitespace-nowrap">
                        <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                        <span>{user.trustScore} p</span>
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
                    ) : (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-sm py-[8px] text-xs font-bold text-error hover:bg-rose-500/10 transition-colors flex items-center gap-xs"
                        title="Supprimer le client"
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
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              <th className="p-md">Nom</th>
              <th className="p-md">E-mail / Téléphone</th>
              <th className="p-md">Statut</th>
              <th className="p-md">Commandes</th>
              <th className="p-md">Points (p)</th>
              <th className="p-md">Dernière Activité</th>
              <th className="p-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-md text-center text-on-surface-variant">
                  Aucun client trouvé.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="p-md">
                    <div className="max-w-[180px] truncate font-semibold text-on-surface" title={user.name || 'Sans Nom'}>
                      {user.name || 'Sans Nom'}
                    </div>
                  </td>
                  <td className="p-md">
                    <div className="max-w-[220px] truncate text-on-surface-variant font-mono text-xs" title={user.email || user.phone || '—'}>
                      {user.email || user.phone || '—'}
                    </div>
                  </td>
                  <td className="p-md">
                    {getStatusBadge(user.status, true)}
                  </td>
                  <td className="p-md font-bold text-on-surface-variant">
                    {user.completedOrderCount}
                  </td>
                  <td className="p-md">
                    <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-xs text-xs font-bold text-emerald-600 border border-emerald-500/20 whitespace-nowrap">
                      <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                      <span className="whitespace-nowrap">{user.trustScore} p</span>
                    </span>
                  </td>
                  <td className="p-md text-on-surface-variant text-xs font-medium whitespace-nowrap">
                    {formatFrenchDate(user.latestActivity)}
                  </td>
                  <td className="p-md text-right whitespace-nowrap">
                    {session?.user?.id === user.id ? (
                      <span className="text-xs text-on-surface-variant italic px-sm font-semibold">
                        Vous (Actif)
                      </span>
                    ) : (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/20 text-on-surface-variant hover:text-error hover:bg-rose-500/5 transition-colors"
                        title="Supprimer le client"
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
