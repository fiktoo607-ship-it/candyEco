"use client";

import React, { useState } from 'react';
import { useDeliverySection } from './hooks/useDeliverySection';
import { 
  DeliveryForm, 
  DeliveryTable 
} from './helpers/DeliverySectionHelpers';
import DashboardDeleteModal from './helpers/DashboardDeleteModal';

export default function DeliverySection() {
  const {
    methods,
    loading,
    error,
    isEditing,
    name,
    setName,
    description,
    setDescription,
    price,
    setPrice,
    active,
    setActive,
    submitError,
    submitLoading,
    handleSubmit,
    resetForm,
    handleEditClick,
    handleToggleActive,
    handleDelete,
    isModalOpen,
    setIsModalOpen,
  } = useDeliverySection();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement des modes de livraison...</p>
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
      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
        {/* Search and Filters Header */}
        <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md sm:flex-row sm:items-center sm:justify-between bg-surface-container-lowest/50">
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">Méthodes de livraison</h2>
            <p className="text-xs text-on-surface-variant mt-xs">Gérez vos options d'expédition et de livraison.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02] h-[46px]"
          >
            <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Ajouter une méthode</span>
          </button>
        </div>

        {/* List Card */}
        <DeliveryTable
          methods={methods}
          onToggleActive={handleToggleActive}
          onEdit={handleEditClick}
          onDelete={(id) => setDeleteTargetId(id)}
        />
      </div>

      {/* Create/Update Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up flex flex-col max-h-[90vh]">
            <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low flex-shrink-0">
              <h2 className="font-display text-xl font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-xl">
                  {isEditing ? 'edit_note' : 'add_circle'}
                </span>
                {isEditing ? 'Modifier la méthode' : 'Créer une méthode de livraison'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <DeliveryForm
              isEditing={isEditing}
              submitError={submitError}
              submitLoading={submitLoading}
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              price={price}
              setPrice={setPrice}
              active={active}
              setActive={setActive}
              onSubmit={handleSubmit}
              onCancel={resetForm}
            />
          </div>
        </div>
      )}

      {/* Custom Delete Modal */}
      <DashboardDeleteModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await handleDelete(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Supprimer la méthode de livraison"
        message="Voulez-vous vraiment supprimer cette méthode de livraison ? Cette action est permanente et ne peut pas être annulée."
      />
    </div>
  );
}
