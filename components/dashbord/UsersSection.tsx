"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: string | null;
}

export default function UsersSection() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deletion state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Impossible de charger les utilisateurs.');
      }
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: string) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      setUsers((prev) => prev.filter((user) => user.id !== id));
      setConfirmDeleteId(null);
      setDeleteLoading(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      (user.name && user.name.toLowerCase().includes(search)) ||
      (user.email && user.email.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-error-container/20 border border-error/20 p-md text-center text-error">
        <span className="material-symbols-outlined text-3xl mb-xs block select-none">warning</span>
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md animate-fade-in">
      {/* Search Widget */}
      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant select-none text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-sm pl-xl pr-md text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
          />
        </div>
        <div className="text-sm text-on-surface-variant font-semibold">
          Total : {filteredUsers.length} utilisateur(s)
        </div>
      </div>

      {deleteError && (
        <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-sm font-medium text-error flex items-start gap-xs">
          <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
          <span>{deleteError}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="px-lg py-md">Nom</th>
                <th className="px-lg py-md">Adresse E-mail</th>
                <th className="px-lg py-md">Rôle</th>
                <th className="px-lg py-md">Statut E-mail</th>
                <th className="px-lg py-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-lg py-md font-semibold text-on-surface">
                      {user.name || 'Sans Nom'}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant font-mono text-xs">
                      {user.email || '—'}
                    </td>
                    <td className="px-lg py-md">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-xs font-bold text-primary">
                          <span className="material-symbols-outlined text-xs select-none">shield</span>
                          Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-xs text-xs font-semibold text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs select-none">person</span>
                          Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="px-lg py-md">
                      {user.emailVerified ? (
                        <span className="inline-flex items-center gap-xs rounded-full bg-emerald-500/10 px-sm py-xs text-xs font-bold text-emerald-600">
                          <span className="material-symbols-outlined text-xs select-none">check_circle</span>
                          Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-xs rounded-full bg-rose-500/10 px-sm py-xs text-xs font-bold text-rose-600">
                          <span className="material-symbols-outlined text-xs select-none">cancel</span>
                          Non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-lg py-md text-right">
                      {session?.user?.id === user.id ? (
                        <span className="text-xs text-on-surface-variant italic px-sm">
                          Vous (Actif)
                        </span>
                      ) : confirmDeleteId === user.id ? (
                        <div className="inline-flex items-center gap-xs">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteLoading}
                            className="rounded-full bg-error px-sm py-xs text-xs font-bold text-white hover:bg-error-container hover:text-on-error-container transition-all"
                          >
                            {deleteLoading ? '...' : 'Confirmer'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleteLoading}
                            className="rounded-full border border-outline-variant bg-surface px-sm py-xs text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="inline-flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
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
    </div>
  );
}
