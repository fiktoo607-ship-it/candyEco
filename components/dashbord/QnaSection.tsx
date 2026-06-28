"use client";

import React from 'react';
import { useQnaSection } from './hooks/useQnaSection';
import {
  QnaFilters,
  QnaTable,
  QnaModal
} from './helpers/QnaSectionHelpers';

export default function QnaSection() {
  const {
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
  } = useQnaSection();

  return (
    <div className="flex flex-col gap-md">
      {error && (
        <div className="rounded-xl bg-error-container p-md text-on-error-container border border-error/20 flex gap-sm items-center">
          <span className="material-symbols-outlined">error</span>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Top Controls */}
      <QnaFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreate={handleOpenCreate}
      />

      {/* Table / List */}
      <QnaTable
        isLoading={isLoading}
        filteredFaqs={filteredFaqs}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* FAQ Modal */}
      <QnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        questionText={questionText}
        setQuestionText={setQuestionText}
        answerText={answerText}
        setAnswerText={setAnswerText}
        onSave={handleSave}
      />
    </div>
  );
}
