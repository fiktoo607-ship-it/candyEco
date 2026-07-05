import React, { useState, useEffect } from 'react';
import { DeliveryMethod } from '../helpers/DeliverySectionHelpers';
import { useDashboardStore } from '@/lib/dashboard-store';

export function useDeliverySection() {
  const { showToast } = useDashboardStore();
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

      showToast(isEditing ? "Méthode de livraison mise à jour avec succès !" : "Méthode de livraison ajoutée avec succès !", "success");
      resetForm();
      fetchMethods();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur réseau.';
      setSubmitError(errMsg);
      showToast(errMsg, "error");
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
        showToast("Statut de la méthode de livraison mis à jour avec succès !", "success");
        fetchMethods();
      } else {
        const data = await res.json();
        showToast(data.error || "Erreur lors de la mise à jour du statut.", "error");
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
      showToast("Erreur lors de la mise à jour du statut.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery-methods/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast("Méthode de livraison supprimée avec succès !", "success");
        fetchMethods();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erreur lors de la suppression.', "error");
      }
    } catch (err) {
      console.error('Error deleting method:', err);
      showToast("Une erreur est survenue lors de la suppression.", "error");
    }
  };

  return {
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
  };
}
