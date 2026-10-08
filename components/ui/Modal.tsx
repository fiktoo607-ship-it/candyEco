"use client";

import React, { useId, useRef } from 'react';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  descriptionId?: string;
  children: React.ReactNode;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  titleId: customTitleId,
  description,
  descriptionId: customDescriptionId,
  children,
  className = '',
  triggerRef,
  closeOnBackdropClick = true,
  showCloseButton = true,
  size = 'md',
}: ModalProps) {
  const generatedTitleId = useId();
  const generatedDescId = useId();

  const titleId = customTitleId || (title ? `modal-title-${generatedTitleId}` : undefined);
  const descriptionId = customDescriptionId || (description ? `modal-desc-${generatedDescId}` : undefined);

  useLockBodyScroll(isOpen);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    triggerRef,
    autoFocusFirst: true,
  });

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-sm md:p-md bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 animate-scale-up focus:outline-none ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
            {title && (
              <h2 id={titleId} className="font-display text-xl font-bold text-on-surface">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la boîte de dialogue"
                className="ml-auto rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-xl select-none" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </header>
        )}

        {/* Optional Description for screen readers */}
        {description && (
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
        )}

        {/* Content */}
        <div className="p-md">
          {children}
        </div>
      </div>
    </div>
  );
}

export { Modal };
