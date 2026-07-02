import React, { useEffect, useState } from 'react';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export function useQnaSection() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');

  const fetchFaqs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/faqs');
      if (!res.ok) {
        throw new Error('Impossible de charger les questions fréquentes.');
      }
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Filter FAQs
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingFaq(null);
    setQuestionText('');
    setAnswerText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: Faq) => {
    setModalMode('edit');
    setEditingFaq(faq);
    setQuestionText(faq.question);
    setAnswerText(faq.answer);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !answerText.trim()) return;

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: questionText.trim(),
            answer: answerText.trim(),
          }),
        });
      } else {
        res = await fetch(`/api/faqs/${editingFaq?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: questionText.trim(),
            answer: answerText.trim(),
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'enregistrement.');
      }

      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {

    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression.');
      }

      fetchFaqs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return {
    faqs,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    questionText,
    setQuestionText,
    answerText,
    setAnswerText,
    filteredFaqs,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleDelete,
  };
}
