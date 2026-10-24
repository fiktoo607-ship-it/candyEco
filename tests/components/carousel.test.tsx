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
      expect(sanitizeSlideUrl('file:///etc/passwd')).toBeNull();
      expect(sanitizeSlideUrl('//evil.com/phish')).toBeNull();
      expect(sanitizeSlideUrl('/\\evil.com')).toBeNull();

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

    it('sanitizes unvalidated external domains and open redirect attempts (Issue #44)', () => {
      // Untrusted external domains must be sanitized to null
      expect(sanitizeSlideUrl('https://evil-phishing.com/steal')).toBeNull();
      expect(sanitizeSlideUrl('https://example.com/promo')).toBeNull();
      expect(sanitizeSlideUrl('http://insecure-domain.com/path')).toBeNull();

      // Trusted domains and relative internal routes must be preserved
      expect(sanitizeSlideUrl('/our-product/macarons')).toBe('/our-product/macarons');
      expect(sanitizeSlideUrl('/products/gateau')).toBe('/products/gateau');
      expect(sanitizeSlideUrl('https://candyeco.dz/our-product/macarons')).toBe('https://candyeco.dz/our-product/macarons');
      expect(sanitizeSlideUrl('https://www.candyeco.dz/promo')).toBe('https://www.candyeco.dz/promo');

      // Component rendering test with external untrusted domain
      const externalSlides: CarouselSlide[] = [
        {
          id: 'external-1',
          title: 'External Phish',
          description: 'Phishing slide',
          imageUrl: '/img-phish.jpg',
          linkUrl: 'https://evil-phishing.com/login',
        },
      ];

      const { container, unmount } = renderComponent(<HeroCarousel slides={externalSlides} />);
      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        expect(href).not.toContain('evil-phishing.com');
      });
      expect(container.textContent).toContain('Bientôt disponible');
      unmount();
    });

    it('properly preserves and navigates to valid product URLs', () => {
      const validSlides: CarouselSlide[] = [
        {
          id: 'slide-prod-1',
          title: 'Macarons Royaux',
          description: 'Saveurs artisanales',
          imageUrl: '/macarons.jpg',
          linkUrl: '/our-product/macarons-royaux',
          isProduct: true,
        },
      ];

      const { container, unmount } = renderComponent(<HeroCarousel slides={validSlides} />);

      const ctaLink = container.querySelector('a[href="/our-product/macarons-royaux"]');
      expect(ctaLink).not.toBeNull();
      expect(ctaLink?.getAttribute('href')).toBe('/our-product/macarons-royaux');
      expect(ctaLink?.textContent).toContain('En savoir plus');

      unmount();
    });
  });

  describe('Continuous Auto-Advancing Smooth Transitions & Clean Controls', () => {
    it('does not render pause/play button and auto-advances slides every 5 seconds', () => {
      vi.useFakeTimers();

      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Ensure no pause/play buttons exist in the controls
      const pauseBtn = container.querySelector(
        'button[aria-label="Mettre en pause le défilement automatique"], button[aria-label="Pause carousel"]'
      );
      const playBtn = container.querySelector(
        'button[aria-label="Activer le défilement automatique"], button[aria-label="Play carousel"]'
      );
      expect(pauseBtn).toBeNull();
      expect(playBtn).toBeNull();

      const dots = container.querySelectorAll('button[aria-label*="diapositive"]');
      expect(dots[0].getAttribute('aria-current')).toBe('true');
      expect(dots[1].getAttribute('aria-current')).toBeNull();

      // Advance timers by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Slide should now have advanced to slide 2
      expect(dots[1].getAttribute('aria-current')).toBe('true');

      unmount();
      vi.useRealTimers();
    });

    it('applies accessible transition and reduced-motion styling classes to slides', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Verify that motion styling classes are applied to the slides
      const section = container.querySelector('section');
      expect(section).not.toBeNull();
      const slides = section?.querySelectorAll('.transition-all, .transition-transform, [class*="motion-reduce"]');
      expect(slides && slides.length > 0).toBe(true);

      unmount();
    });
  });
});
