// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act, useState, useRef } from 'react';
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

import Modal from '@/components/ui/Modal';
import HeroCarousel, { CarouselSlide } from '@/components/home/HeroCarousel';
import Toast from '@/components/Toast';
import DeleteModal from '@/components/dashbord/DeleteModal';

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

describe('Prompt 9: Accessible Modals, Controllable Carousels, and Live Regions (Issues #27, #26, #24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Issue #27: Accessible Modal Dialogs & Focus Trap (components/ui/Modal.tsx)', () => {
    it('renders role="dialog", aria-modal="true", and aria-labelledby pointing to title heading', () => {
      const { container, unmount } = renderComponent(
        <Modal isOpen={true} onClose={vi.fn()} title="Titre de la boîte de dialogue">
          <p>Contenu modal</p>
        </Modal>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');

      const titleId = dialog?.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();

      const heading = container.querySelector(`#${titleId}`);
      expect(heading).not.toBeNull();
      expect(heading?.textContent).toContain('Titre de la boîte de dialogue');

      unmount();
    });

    it('pressing Escape inside an open modal closes it and calls onClose', () => {
      const onCloseMock = vi.fn();
      const { container, unmount } = renderComponent(
        <Modal isOpen={true} onClose={onCloseMock} title="Dialogue Test">
          <button type="button">Bouton intérieur</button>
        </Modal>
      );

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      expect(onCloseMock).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('traps keyboard focus inside modal and cycles focus with Tab and Shift+Tab', () => {
      const { container, unmount } = renderComponent(
        <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Modal">
          <button id="btn-1" type="button">Premier</button>
          <input id="input-1" type="text" defaultValue="Milieu" />
          <button id="btn-2" type="button">Dernier</button>
        </Modal>
      );

      const closeBtn = container.querySelector('button[aria-label="Fermer la boîte de dialogue"]') as HTMLButtonElement;
      const btn1 = container.querySelector('#btn-1') as HTMLButtonElement;
      const btn2 = container.querySelector('#btn-2') as HTMLButtonElement;

      expect(closeBtn).not.toBeNull();
      expect(btn1).not.toBeNull();
      expect(btn2).not.toBeNull();

      // Focus last element, press Tab -> should cycle to first element (close button)
      btn2.focus();
      expect(document.activeElement).toBe(btn2);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      });
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element, press Shift+Tab -> should cycle to last element (btn2)
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
      });
      expect(document.activeElement).toBe(btn2);

      unmount();
    });

    it('restores focus to trigger element when modal is closed', () => {
      function TriggerWrapper() {
        const [isOpen, setIsOpen] = useState(false);
        const triggerRef = useRef<HTMLButtonElement>(null);

        return (
          <div>
            <button
              ref={triggerRef}
              id="trigger-btn"
              type="button"
              onClick={() => setIsOpen(true)}
            >
              Ouvrir
            </button>
            <Modal
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              triggerRef={triggerRef}
              title="Test Restauration Focus"
            >
              <button id="inside-btn" type="button">Intérieur</button>
            </Modal>
          </div>
        );
      }

      const { container, unmount } = renderComponent(<TriggerWrapper />);

      const triggerBtn = container.querySelector('#trigger-btn') as HTMLButtonElement;
      expect(triggerBtn).not.toBeNull();

      // Click trigger to focus and open
      act(() => {
        triggerBtn.focus();
        triggerBtn.click();
      });

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();

      // Press Escape to close modal
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      // Dialog is closed and focus restored to trigger
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);

      unmount();
    });

    it('dashboard DeleteModal includes role="dialog", aria-modal="true", and aria-labelledby', () => {
      const src = fs.readFileSync(path.join(process.cwd(), 'components/dashbord/DeleteModal.tsx'), 'utf8');
      expect(src).toContain('role="dialog"');
      expect(src).toContain('aria-modal="true"');
      expect(src).toContain('aria-labelledby="delete-modal-title"');
      expect(src).toContain('useFocusTrap');
    });
  });

  describe('Issue #26: Auto-Advancing Carousels, Play/Pause Toggle & prefers-reduced-motion', () => {
    const mockSlides: CarouselSlide[] = [
      {
        id: 's-1',
        title: 'Slide 1',
        description: 'Description 1',
        imageUrl: '/img1.jpg',
      },
      {
        id: 's-2',
        title: 'Slide 2',
        description: 'Description 2',
        imageUrl: '/img2.jpg',
      },
    ];

    it('HeroCarousel provides a visible Pause/Play toggle button with accessible aria-label and aria-pressed', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      const pauseButton = container.querySelector('button[aria-label="Pause carousel"]') as HTMLButtonElement;
      expect(pauseButton).not.toBeNull();
      expect(pauseButton.getAttribute('aria-pressed')).toBe('false');

      // Click button to pause
      act(() => {
        pauseButton.click();
      });

      const playButton = container.querySelector('button[aria-label="Play carousel"]') as HTMLButtonElement;
      expect(playButton).not.toBeNull();
      expect(playButton.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('HeroCarousel disables automatic sliding when prefers-reduced-motion is active', () => {
      // Mock matchMedia to report prefers-reduced-motion: reduce
      const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMediaMock;

      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // When reduced motion is preferred, carousel must not be auto-playing initially
      const toggleBtn = container.querySelector('button[aria-label="Play carousel"]');
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('HeroCarousel auto-advances when normal motion is allowed', () => {
      vi.useFakeTimers();

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      const pauseBtn = container.querySelector('button[aria-label="Pause carousel"]');
      expect(pauseBtn).not.toBeNull();

      // Fast-forward 6 seconds
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // After 6s, slide 1 should become active
      const dots = container.querySelectorAll('button[aria-label^="Go to slide"]');
      expect(dots[1].getAttribute('aria-current')).toBe('true');

      unmount();
      vi.useRealTimers();
    });
  });

  describe('Issue #24: Screen Reader Live Regions for Alerts and Toast (components/Toast.tsx)', () => {
    it('Toast component includes role="status" and aria-live="polite"', () => {
      const { container, unmount } = renderComponent(
        <Toast message="Votre panier a été mis à jour." type="success" onClose={vi.fn()} />
      );

      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).not.toBeNull();
      expect(statusElement?.getAttribute('aria-live')).toBe('polite');
      expect(statusElement?.textContent).toContain('Votre panier a été mis à jour.');

      unmount();
    });

    it('Toast renders error alert correctly with polite live region announcement', () => {
      const { container, unmount } = renderComponent(
        <Toast message="Une erreur est survenue lors du paiement." type="error" onClose={vi.fn()} />
      );

      const alertElement = container.querySelector('[role="status"][aria-live="polite"]');
      expect(alertElement).not.toBeNull();
      expect(alertElement?.textContent).toContain('Une erreur est survenue');

      unmount();
    });
  });
});
