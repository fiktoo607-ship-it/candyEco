import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '../helpers/UsersSectionHelpers';
import { useDashboardStore } from '@/lib/dashboard-store';

export function useUsersSection() {
  const { showToast } = useDashboardStore();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trustScore');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Deletion state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = async (activeSortBy = sortBy, activeSortOrder = sortOrder) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?sortBy=${activeSortBy}&sortOrder=${activeSortOrder}`);
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
    fetchUsers(sortBy, sortOrder);
  }, [sortBy, sortOrder]);

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
      showToast("Utilisateur supprimé avec succès !", "success");
      setConfirmDeleteId(null);
      setDeleteLoading(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setDeleteError(errMsg);
      showToast(errMsg, "error");
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      (user.name && user.name.toLowerCase().includes(search)) ||
      (user.email && user.email.toLowerCase().includes(search)) ||
      (user.phone && user.phone.includes(search))
    );
  });

  return {
    session,
    users,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    confirmDeleteId,
    setConfirmDeleteId,
    deleteLoading,
    deleteError,
    filteredUsers,
    handleDeleteUser,
  };
}
