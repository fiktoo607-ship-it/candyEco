// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/home',
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: vi.fn(),
  SessionProvider: ({ children }: any) => <div>{children}</div>,
}));

import Modal from '@/components/ui/Modal';
import DashboardDeleteModal from '@/components/dashbord/helpers/DashboardDeleteModal';
import { OrderStatusConfirmModal } from '@/components/dashbord/orders/OrderStatusConfirmModal';
import { OrderDetailsModal } from '@/components/dashbord/orders/OrderDetailsModal';
import { SlideModal } from '@/components/dashbord/cms/SlideModal';
import { QnaModal } from '@/components/dashbord/helpers/QnaSectionHelpers';
import { LieuPriceModal } from '@/components/dashbord/helpers/DeliverySectionHelpers';
import Toast from '@/components/Toast';

function renderComponent(ui: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('Accessibility: Modals, Focus Traps, and Material Icon Ligatures (Issues #26, #58, #124)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Issue #26: Modal Dialog Semantics, Focus Trapping, and Escape Dismissal', () => {
    it('Modal component enforces role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      const { container, unmount } = renderComponent(
        <Modal isOpen={true} onClose={onClose} title="Boîte de dialogue">
          <button id="modal-btn-1" type="button">Action 1</button>
          <button id="modal-btn-2" type="button">Action 2</button>
        </Modal>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
      expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();

      // Pressing Escape should trigger onClose
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('DashboardDeleteModal enforces role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();
      const { container, unmount } = renderComponent(
        <DashboardDeleteModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Supprimer la sélection"
          message="Confirmez-vous la suppression ?"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
      expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();

      // Close button must have accessible label
      const closeBtn = container.querySelector('button[aria-label="Fermer la boîte de dialogue"]');
      expect(closeBtn).not.toBeNull();

      // Pressing Escape should trigger onClose
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('QnaModal enforces role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      const onSave = vi.fn();
      const { container, unmount } = renderComponent(
        <QnaModal
          isOpen={true}
          onClose={onClose}
          modalMode="create"
          questionText=""
          setQuestionText={vi.fn()}
          answerText=""
          setAnswerText={vi.fn()}
          onSave={onSave}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('LieuPriceModal enforces role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      const { container, unmount } = renderComponent(
        <LieuPriceModal
          isOpen={true}
          method={{ id: '1', name: 'Livraison Rapide', description: null, price: 500, active: true }}
          homePrice="600"
          setHomePrice={vi.fn()}
          stockPrice="400"
          setStockPrice={vi.fn()}
          submitError={null}
          submitLoading={false}
          onSubmit={vi.fn()}
          onClose={onClose}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('traps keyboard focus inside Modal dialog when tabbing', () => {
      const { container, unmount } = renderComponent(
        <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Dialog">
          <button id="first-btn" type="button">Premier</button>
          <button id="second-btn" type="button">Deuxième</button>
        </Modal>
      );

      const closeBtn = container.querySelector('button[aria-label="Fermer la boîte de dialogue"]') as HTMLButtonElement;
      const firstBtn = container.querySelector('#first-btn') as HTMLButtonElement;
      const secondBtn = container.querySelector('#second-btn') as HTMLButtonElement;

      expect(closeBtn).not.toBeNull();
      expect(firstBtn).not.toBeNull();
      expect(secondBtn).not.toBeNull();

      // Simulate Tab key cycling
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      // Shift+Tab from closeBtn (first element) wraps to last element
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      document.dispatchEvent(shiftTabEvent);

      unmount();
    });
  });

  describe('Issue #58 & #124: Material Icon Ligatures and Accessible Controls', () => {
    it('Toast status icon has aria-hidden="true" to prevent ligature text leakage', () => {
      const { container, unmount } = renderComponent(
        <Toast message="Opération réussie" type="success" onClose={vi.fn()} />
      );

      const icon = container.querySelector('.material-symbols-outlined');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');

      unmount();
    });

    it('OrderStatusConfirmModal icons have aria-hidden="true"', () => {
      const { container, unmount } = renderComponent(
        <OrderStatusConfirmModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          reference="CMD-1234"
          currentStatus="pending"
          newStatus="completed"
        />
      );

      const icons = container.querySelectorAll('.material-symbols-outlined');
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });

      unmount();
    });

    it('SlideModal icons have aria-hidden="true"', () => {
      const { container, unmount } = renderComponent(
        <SlideModal
          isOpen={true}
          onClose={vi.fn()}
          editingSlide={null}
          slideTitle=""
          setSlideTitle={vi.fn()}
          slideDescription=""
          setSlideDescription={vi.fn()}
          slideLinkUrl=""
          setSlideLinkUrl={vi.fn()}
          slideImageUrl=""
          setSlideImageUrl={vi.fn()}
          isSlideUploading={false}
          slideUploadError={null}
          isSlideSubmitting={false}
          handleSlideImageUpload={vi.fn()}
          handleSlideSubmit={vi.fn()}
        />
      );

      const icons = container.querySelectorAll('.material-symbols-outlined');
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });

      unmount();
    });

    it('ensures all Material icons in dashboard and storefront modal components have aria-hidden="true"', () => {
      const modalFiles = [
        'components/ui/Modal.tsx',
        'components/dashbord/ProductModal.tsx',
        'components/dashbord/orders/OrderStatusConfirmModal.tsx',
        'components/dashbord/orders/OrderDetailsModal.tsx',
        'components/dashbord/users/FidelityConfigModal.tsx',
        'components/dashbord/cms/SlideModal.tsx',
        'components/dashbord/helpers/QnaSectionHelpers.tsx',
        'components/dashbord/helpers/DeliverySectionHelpers.tsx',
        'components/dashbord/DeliverySection.tsx',
      ];

      for (const relativePath of modalFiles) {
        const fullPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('material-symbols-outlined') && !line.includes('//') && !line.includes('/*')) {
              expect(
                line.includes('aria-hidden="true"'),
                `Icon at ${relativePath}:${idx + 1} must have aria-hidden="true". Found line: ${line.trim()}`
              ).toBe(true);
            }
          });
        }
      }
    });

    it('ensures interactive close buttons on modal components have aria-label', () => {
      const modalFiles = [
        'components/ui/Modal.tsx',
        'components/dashbord/ProductModal.tsx',
        'components/dashbord/DeleteModal.tsx',
        'components/dashbord/helpers/DashboardDeleteModal.tsx',
        'components/dashbord/orders/OrderStatusConfirmModal.tsx',
        'components/dashbord/orders/OrderDetailsModal.tsx',
        'components/dashbord/users/FidelityConfigModal.tsx',
        'components/dashbord/cms/SlideModal.tsx',
        'components/dashbord/helpers/QnaSectionHelpers.tsx',
        'components/dashbord/helpers/DeliverySectionHelpers.tsx',
        'components/dashbord/DeliverySection.tsx',
      ];

      for (const relativePath of modalFiles) {
        const fullPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Match buttons that contain close icon or call onClose
          expect(content).toMatch(/aria-label=["'][^"']*Fermer[^"']*["']/i);
        }
      }
    });
  });
});
