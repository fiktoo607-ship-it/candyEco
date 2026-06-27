"use client";

import React, { useState, useEffect } from 'react';
import { 
  DeliveryMethod, 
  DeliveryForm, 
  DeliveryTable 
} from './helpers/DeliverySectionHelpers';

export default function DeliverySection() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.0');
  const [active, setActive] = useState(true);
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery-methods');
      if (!res.ok) {
        throw new Error('Impossible de charger les méthodes de livraison.');
      }
      const data = await res.json();
      setMethods(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('0.0');
    setActive(true);
    setSubmitError(null);
  };

  const handleEditClick = (method: DeliveryMethod) => {
    setIsEditing(true);
    setEditingId(method.id);
    setName(method.name);
    setDescription(method.description || '');
    setPrice(String(method.price));
    setActive(method.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setSubmitError('Le nom est requis.');
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError(null);

      const url = isEditing && editingId 
        ? `/api/delivery-methods/${editingId}`
        : '/api/delivery-methods';
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          price: parseFloat(price) || 0.0,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l’enregistrement.');
      }

      resetForm();
      fetchMethods();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (method: DeliveryMethod) => {
    try {
      const res = await fetch(`/api/delivery-methods/${method.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !method.active,
        }),
      });
      if (res.ok) {
        fetchMethods();
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette méthode de livraison ?')) return;

    try {
      const res = await fetch(`/api/delivery-methods/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMethods();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      console.error('Error deleting method:', err);
    }
  };

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
        onDelete={handleDelete}
      />
    </div>
  );
}
