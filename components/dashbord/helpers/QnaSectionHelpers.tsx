import React from 'react';
import { Faq } from '../hooks/useQnaSection';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';

// ============================================================================
// 1. QnaFilters
// ============================================================================

interface QnaFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onOpenCreate: () => void;
}

export function QnaFilters({
  searchQuery,
  setSearchQuery,
  onOpenCreate,
}: QnaFiltersProps) {
  return (
    <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between bg-surface-container-lowest/50 p-md rounded-2xl border border-outline-variant/10 shadow-soft">
      {/* Search Input */}
      <label className="relative w-full sm:w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
          search
        </span>
        <input
          type="text"
          placeholder="Rechercher des FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-sm pl-10 pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {/* Add Button */}
      <button
        onClick={onOpenCreate}
        className="inline-flex items-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint flex-shrink-0 justify-center h-[46px]"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Ajouter une FAQ
      </button>
    </div>
  );
}

// ============================================================================
// 2. QnaTable
// ============================================================================

interface QnaTableProps {
  isLoading: boolean;
  filteredFaqs: Faq[];
  onOpenEdit: (faq: Faq) => void;
  onDelete: (id: string) => void;
}

export function QnaTable({
  isLoading,
  filteredFaqs,
  onOpenEdit,
  onDelete,
}: QnaTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-md bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-soft">
        <svg className="w-10 h-10 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <p className="text-on-surface-variant">Chargement des questions fréquentes...</p>
      </div>
    );
  }

  if (filteredFaqs.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/60 animate-pulse">question_answer</span>
        <p className="text-lg font-semibold">Aucune FAQ trouvée</p>
        <p className="text-sm">Ajouter une question fréquente ou modifier les filtres.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile/Tablet Accordion Cards Layout (< 1024px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md lg:hidden bg-surface/20">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
            <div className="space-y-sm">
              <div className="flex items-start justify-between gap-sm border-b border-outline-variant/10 pb-sm">
                <h3 className="font-bold text-on-surface text-base leading-normal flex items-start gap-xs">
                  <span className="material-symbols-outlined text-primary text-xl mt-[2px] select-none flex-shrink-0">help_outline</span>
                  {faq.question}
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap pl-7">
                {faq.answer}
              </div>
            </div>

            <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto pl-7">
              <div className="flex justify-between items-center text-xs text-on-surface-variant/80">
                <span className="flex items-center gap-[2px]">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  {new Date(faq.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-xs">
                <button
                  onClick={() => onOpenEdit(faq)}
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(faq.id)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-sm py-xs text-xs font-bold text-error hover:bg-rose-500/10 transition-colors flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Grid Layout (>= 1024px) */}
      <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-soft lg:block hidden">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              <th className="p-md w-1/3">Question</th>
              <th className="p-md w-1/2">Réponse</th>
              <th className="p-md">Date de création</th>
              <th className="p-md text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 text-on-surface">
            {filteredFaqs.map((faq) => (
              <tr key={faq.id} className="group transition-colors hover:bg-surface/50">
                <td className="p-md font-semibold text-base leading-normal">
                  <div className="flex items-start gap-xs">
                    <span className="material-symbols-outlined text-primary text-xl mt-[2px] select-none flex-shrink-0">help_outline</span>
                    <span>{faq.question}</span>
                  </div>
                </td>
                <td className="p-md text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                  {faq.answer}
                </td>
                <td className="p-md text-xs text-on-surface-variant/80 font-medium">
                  {new Date(faq.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-md text-right">
                  <div className="flex justify-end gap-xs">
                    <button
                      onClick={() => onOpenEdit(faq)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-outline-variant/20 text-primary hover:bg-surface-container-low active:scale-95 transition-all"
                      title="Modifier la FAQ"
                    >
                      <span className="material-symbols-outlined text-lg select-none">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(faq.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-rose-500/20 text-error hover:bg-rose-500/5 active:scale-95 transition-all"
                      title="Supprimer la FAQ"
                    >
                      <span className="material-symbols-outlined text-lg select-none">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============================================================================
// 3. QnaModal
// ============================================================================

interface QnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: 'create' | 'edit';
  questionText: string;
  setQuestionText: (v: string) => void;
  answerText: string;
  setAnswerText: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export function QnaModal({
  isOpen,
  onClose,
  modalMode,
  questionText,
  setQuestionText,
  answerText,
  setAnswerText,
  onSave,
}: QnaModalProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-sm md:p-md bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest flex flex-col max-h-[90vh] overflow-hidden shadow-soft border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-md bg-surface-container-low flex-shrink-0">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-xl">help_outline</span>
            {modalMode === 'create' ? 'Ajouter une FAQ' : 'Modifier la FAQ'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={onSave} className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">Question *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ex: Quels sont vos horaires d'ouverture ?"
              rows={3}
              required
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">Réponse *</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Ex: Nous sommes ouverts de 8h à 20h du lundi au samedi."
              rows={5}
              required
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-sm mt-auto pt-sm border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-md py-sm text-sm font-bold text-white shadow-soft hover:bg-surface-tint transition-colors flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
