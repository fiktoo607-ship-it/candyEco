"use client";

import React from 'react';
import { useUsersSection } from './hooks/useUsersSection';
import { UsersFilters } from './users/UsersFilters';
import { UsersTable } from './users/UsersTable';
import DashboardDeleteModal from './helpers/DashboardDeleteModal';

export default function UsersSection() {
  const {
    session,
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
  } = useUsersSection();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement des clients...</p>
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
      {/* Search & Sort Widget */}
      <UsersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        totalUsers={filteredUsers.length}
      />

      {deleteError && (
        <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-sm font-medium text-error flex items-start gap-xs">
          <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
          <span>{deleteError}</span>
        </div>
      )}

      {/* Users Table */}
      <UsersTable
        filteredUsers={filteredUsers}
        session={session}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        deleteLoading={deleteLoading}
        onDeleteUser={(id) => setConfirmDeleteId(id)}
      />

      {/* Custom Delete Modal */}
      <DashboardDeleteModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId) {
            await handleDeleteUser(confirmDeleteId);
          }
        }}
        isSubmitting={deleteLoading}
        title="Supprimer le client"
        message="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est permanente et ne peut pas être annulée."
      />
    </div>
  );
}
