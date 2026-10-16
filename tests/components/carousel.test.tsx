// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HeroCarousel, { CarouselSlide, sanitizeSlideUrl } from '@/components/home/HeroCarousel';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

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

describe('Issues #27, #44, and #126: Carousel Accessibility, Security & Motion Controls', () => {
  const mockSlides: CarouselSlide[] = [
    {
      id: 'slide-1',
      title: 'Pâtisserie Fine 1',
      description: 'Délicieux macarons faits main.',
      imageUrl: '/img1.jpg',
      linkUrl: '/our-product/macarons',
    },
    {
      id: 'slide-2',
      title: 'Chocolat Artisanal 2',
      description: 'Chocolat noir pur beurre de cacao.',
      imageUrl: '/img2.jpg',
      linkUrl: null, // Slide without link
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Issue #27: French aria-labels & Localized Control Text', () => {
    it('uses French aria-labels for navigation controls and does not contain English labels', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Verify NO English labels exist
      expect(container.querySelector('button[aria-label="Previous Slide"]')).toBeNull();
      expect(container.querySelector('button[aria-label="Next Slide"]')).toBeNull();
      expect(container.querySelector('button[aria-label^="Go to slide"]')).toBeNull();

      // Verify French navigation buttons exist
      const prevBtn = container.querySelector('button[aria-label="Diapositive précédente"]');
      const nextBtn = container.querySelector('button[aria-label="Diapositive suivante"]');
      expect(prevBtn).not.toBeNull();
      expect(nextBtn).not.toBeNull();

      // Verify French dot indicator labels exist
      const dots = container.querySelectorAll('button[aria-label^="Aller à la diapositive"], button[aria-label^="Afficher la diapositive"]');
      expect(dots.length).toBe(mockSlides.length);
      expect(dots[0].getAttribute('aria-label')).toMatch(/diapositive 1/i);
      expect(dots[1].getAttribute('aria-label')).toMatch(/diapositive 2/i);

      // Verify localized label for coming soon instead of English "Coming Soon"
      expect(container.textContent).not.toContain('Coming Soon');
      expect(container.textContent).toContain('Bientôt disponible');

      unmount();
    });
  });

  describe('Issue #44: Target URL Sanitization & Neutralizing Malicious Links', () => {
    it('neutralizes javascript:alert(1) and other malicious protocols in linkUrl', () => {
      // 1. Function unit test
      expect(sanitizeSlideUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeSlideUrl('javascript:void(0)')).toBeNull();
      expect(sanitizeSlideUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeSlideUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeSlideUrl('//evil.com/phish')).toBeNull();

      // 2. Component rendering test with malicious linkUrl
      const maliciousSlides: CarouselSlide[] = [
        {
          id: 'malicious-1',
          title: 'Offre Spéciale',
          description: 'Cliquez ici',
          imageUrl: '/img-malicious.jpg',
          linkUrl: 'javascript:alert(1)',
        },
      ];

      const { container, unmount } = renderComponent(<HeroCarousel slides={maliciousSlides} />);

      // Ensure no anchor element contains javascript: or points to javascript:alert(1)
      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        expect(href.toLowerCase()).not.toContain('javascript:');
        expect(href).not.toBe('javascript:alert(1)');
      });

      // The malicious link should be neutralized into coming soon / disabled state
      expect(container.textContent).toContain('Bientôt disponible');

      unmount();
    });
  });

  describe('Issue #126: Auto-Advancing Motion Controls & prefers-reduced-motion Support', () => {
    it('provides an accessible pause/play button to stop and resume auto-advancing slides', () => {
      vi.useFakeTimers();

      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Locate pause/play toggle button with French aria-label
      const pauseBtn = container.querySelector(
        'button[aria-label="Mettre en pause le défilement automatique"], button[aria-label="Arrêter le défilement automatique"]'
      ) as HTMLButtonElement;
      expect(pauseBtn).not.toBeNull();

      // Click pause button
      act(() => {
        pauseBtn.click();
      });

      // Advance timers by 6 seconds
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // Slide should NOT have changed because it was paused
      const dots = container.querySelectorAll('button[aria-label*="diapositive"]');
      expect(dots[0].getAttribute('aria-current')).toBe('true');
      expect(dots[1].getAttribute('aria-current')).toBeNull();

      // Now resume playback
      const playBtn = container.querySelector(
        'button[aria-label="Activer le défilement automatique"], button[aria-label="Reprendre le défilement automatique"]'
      ) as HTMLButtonElement;
      expect(playBtn).not.toBeNull();

      act(() => {
        playBtn.click();
      });

      // Advance timers by 6 seconds
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // Slide should now have advanced to slide 2
      expect(dots[1].getAttribute('aria-current')).toBe('true');

      unmount();
      vi.useRealTimers();
    });

    it('respects prefers-reduced-motion media query by disabling auto-advance by default and applying reduced motion styles', () => {
      // Mock window.matchMedia for prefers-reduced-motion: reduce
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

      vi.useFakeTimers();

      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Verify that reduced motion styles/classes are applied or active
      const section = container.querySelector('section');
      expect(section).not.toBeNull();
      const slides = section?.querySelectorAll('.transition-all, .transition-transform, [class*="motion-reduce"]');
      expect(slides && slides.length > 0).toBe(true);

      // Verify auto-advance does not trigger when prefers-reduced-motion is true
      act(() => {
        vi.advanceTimersByTime(12000);
      });

      const dots = container.querySelectorAll('button[aria-label*="diapositive"]');
      expect(dots[0].getAttribute('aria-current')).toBe('true');
      expect(dots[1].getAttribute('aria-current')).toBeNull();

      unmount();
      vi.useRealTimers();
    });
  });
});
