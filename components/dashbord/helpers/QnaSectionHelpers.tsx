import React from 'react';
import { Faq } from '../hooks/useQnaSection';

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
    <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
      <label className="relative w-full sm:w-80">
        <svg className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher des FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-xl pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <button
        onClick={onOpenCreate}
        className="inline-flex items-center gap-xs rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
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
      <div className="flex h-64 flex-col items-center justify-center gap-md">
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
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">question_answer</span>
        <p className="text-lg font-semibold">Aucune FAQ trouvée</p>
        <p className="text-sm">Ajouter une question fréquente ou modifier les filtres.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-soft">
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
                {faq.question}
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
                    className="inline-flex items-center justify-center rounded-full p-2 text-primary transition-all hover:bg-primary-container/10 active:scale-95"
                    title="Modifier la FAQ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(faq.id)}
                    className="inline-flex items-center justify-center rounded-full p-2 text-error transition-all hover:bg-error-container/30 active:scale-95"
                    title="Supprimer la FAQ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-1.8c0-.661-.493-1.19-1.15-1.19h-3.78c-.657 0-1.15.529-1.15 1.19v1.8m-5.8 0h12" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-lg shadow-soft border border-outline-variant/10 transition-all">
        <h3 className="font-display text-xl font-bold text-on-surface mb-md">
          {modalMode === 'create' ? 'Ajouter une question fréquente' : 'Modifier la question fréquente'}
        </h3>
        <form onSubmit={onSave} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-on-surface-variant">Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ex: Quels sont vos horaires d'ouverture ?"
              rows={3}
              required
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-on-surface-variant">Réponse</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Ex: Nous sommes ouverts de 8h à 20h du lundi au samedi."
              rows={5}
              required
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>

          <div className="flex justify-end gap-sm mt-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-outline-variant px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft hover:bg-surface-tint transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
