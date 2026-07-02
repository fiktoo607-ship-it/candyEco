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
    <div className="grid grid-cols-1 gap-md lg:grid-cols-3 animate-fade-in">
      {/* Form Card */}
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

      {/* List Card */}
      <DeliveryTable
        methods={methods}
        onToggleActive={handleToggleActive}
        onEdit={handleEditClick}
        onDelete={(id) => setDeleteTargetId(id)}
      />

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
