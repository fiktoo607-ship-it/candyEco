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
  const [homePrice, setHomePrice] = useState('0.0');
  const [stockPrice, setStockPrice] = useState('0.0');
  const [active, setActive] = useState(true);
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lieu Price Quick Update Modal State
  const [lieuModalMethod, setLieuModalMethod] = useState<DeliveryMethod | null>(null);
  const [isLieuModalOpen, setIsLieuModalOpen] = useState(false);
  const [lieuHomePrice, setLieuHomePrice] = useState('0.0');
  const [lieuStockPrice, setLieuStockPrice] = useState('0.0');
  const [lieuSubmitLoading, setLieuSubmitLoading] = useState(false);
  const [lieuSubmitError, setLieuSubmitError] = useState<string | null>(null);

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
    setHomePrice('0.0');
    setStockPrice('0.0');
    setActive(true);
    setSubmitError(null);
    setIsModalOpen(false);
  };

  const handleOpenLieuModal = (method: DeliveryMethod) => {
    setLieuModalMethod(method);
    setLieuHomePrice(String(method.homePrice ?? method.price ?? 0));
    setLieuStockPrice(String(method.stockPrice ?? method.price ?? 0));
    setLieuSubmitError(null);
    setIsLieuModalOpen(true);
  };

  const handleCloseLieuModal = () => {
    setIsLieuModalOpen(false);
    setLieuModalMethod(null);
    setLieuSubmitError(null);
  };

  const handleSaveLieuPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lieuModalMethod) return;

    try {
      setLieuSubmitLoading(true);
      setLieuSubmitError(null);

      const parsedHome = parseFloat(lieuHomePrice) || 0.0;
      const parsedStock = parseFloat(lieuStockPrice) || 0.0;

      const res = await fetch(`/api/delivery-methods/${lieuModalMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homePrice: parsedHome,
          stockPrice: parsedStock,
          price: parsedHome, // keep base price in sync with home price
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour des prix.');
      }

      showToast("Prix par lieu mis à jour avec succès !", "success");
      handleCloseLieuModal();
      fetchMethods();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur réseau.';
      setLieuSubmitError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setLieuSubmitLoading(false);
    }
  };

  const handleEditClick = (method: DeliveryMethod) => {
    setIsEditing(true);
    setEditingId(method.id);
    setName(method.name);
    setDescription(method.description || '');
    setPrice(String(method.price ?? 0));
    setHomePrice(String(method.homePrice ?? method.price ?? 0));
    setStockPrice(String(method.stockPrice ?? method.price ?? 0));
    setActive(method.active);
    setIsModalOpen(true);
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

      const parsedHome = parseFloat(homePrice) || 0.0;
      const parsedStock = parseFloat(stockPrice) || 0.0;
      const parsedBase = parseFloat(price) || parsedHome || 0.0;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          price: parsedBase,
          homePrice: parsedHome,
          stockPrice: parsedStock,
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
    homePrice,
    setHomePrice,
    stockPrice,
    setStockPrice,
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
    // Lieu Price Modal exports
    lieuModalMethod,
    isLieuModalOpen,
    lieuHomePrice,
    setLieuHomePrice,
    lieuStockPrice,
    setLieuStockPrice,
    lieuSubmitLoading,
    lieuSubmitError,
    handleOpenLieuModal,
    handleCloseLieuModal,
    handleSaveLieuPrice,
  };
}
