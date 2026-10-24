// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HeroCarousel, { CarouselSlide, sanitizeSlideUrl } from '@/components/home/HeroCarousel';
import HeroCarouselReExport from '@/components/hero-carousel';
import CategoryFilter, { defaultCategories } from '@/components/category-filter';

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

describe('A11y Fixes Verification (Issues #56, #57)', () => {
  const mockSlides: CarouselSlide[] = [
    {
      id: 'slide-1',
      title: 'Pâtisserie Artisanale 1',
      description: 'Découvrez nos gâteaux faits maison avec des ingrédients bio.',
      imageUrl: '/slide1.jpg',
      linkUrl: '/our-product/gateau-bio',
    },
    {
      id: 'slide-2',
      title: 'Viennoiseries Croustillantes 2',
      description: 'Chaque matin, nos croissants et pains au chocolat frais.',
      imageUrl: '/slide2.jpg',
      linkUrl: '/our-product/croissant',
    },
    {
      id: 'slide-3',
      title: 'Douceurs Traditionnelles 3',
      description: 'Recettes ancestrales préparées avec amour.',
      imageUrl: '/slide3.jpg',
      linkUrl: null,
    },
  ];

  describe('Issue #56: Hero Carousel Single H1 and Hidden Slide Inertness', () => {
    it('re-export in components/hero-carousel matches components/home/HeroCarousel', () => {
      expect(HeroCarouselReExport).toBe(HeroCarousel);
    });

    it('renders semantic h2 headings for slide titles to preserve page-level h1 landmark (Issue #127)', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // Under Issue #127, slide titles use h2 so the page-level h1 landmark outside the carousel is never hidden when slides cycle
      const h2Elements = container.querySelectorAll('h2');
      expect(h2Elements.length).toBe(3);
      expect(h2Elements[0].textContent).toContain('Pâtisserie Artisanale 1');
      expect(h2Elements[1].textContent).toContain('Viennoiseries Croustillantes 2');
      expect(h2Elements[2].textContent).toContain('Douceurs Traditionnelles 3');

      unmount();
    });

    it('sets aria-hidden="true" and inert on inactive slides, leaving active slide accessible', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      // The carousel slides container has child divs corresponding to displaySlides
      const slidesContainer = container.querySelector('section > div.absolute.inset-0');
      expect(slidesContainer).not.toBeNull();

      const slideItems = slidesContainer?.children;
      expect(slideItems?.length).toBe(3);

      // Slide 0 is active initially
      const slide0 = slideItems?.[0] as HTMLElement;
      expect(slide0.getAttribute('aria-hidden')).toBeNull();
      expect(slide0.hasAttribute('inert')).toBe(false);

      // Slide 1 & 2 are inactive initially
      const slide1 = slideItems?.[1] as HTMLElement;
      expect(slide1.getAttribute('aria-hidden')).toBe('true');
      expect(slide1.hasAttribute('inert')).toBe(true);

      const slide2 = slideItems?.[2] as HTMLElement;
      expect(slide2.getAttribute('aria-hidden')).toBe('true');
      expect(slide2.hasAttribute('inert')).toBe(true);

      unmount();
    });

    it('transfers active state, inert, and aria-hidden when clicking next or indicator dots', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      const nextButton = (container.querySelector('button[aria-label="Diapositive suivante"]') ||
        container.querySelector('button[aria-label="Next Slide"]')) as HTMLButtonElement;
      expect(nextButton).not.toBeNull();

      act(() => {
        nextButton.click();
      });

      const slidesContainer = container.querySelector('section > div.absolute.inset-0');
      const slideItems = slidesContainer?.children;

      // Slide 0 should now be inactive
      const slide0 = slideItems?.[0] as HTMLElement;
      expect(slide0.getAttribute('aria-hidden')).toBe('true');
      expect(slide0.hasAttribute('inert')).toBe(true);

      // Slide 1 should now be active
      const slide1 = slideItems?.[1] as HTMLElement;
      expect(slide1.getAttribute('aria-hidden')).toBeNull();
      expect(slide1.hasAttribute('inert')).toBe(false);

      // Slide 2 remains inactive
      const slide2 = slideItems?.[2] as HTMLElement;
      expect(slide2.getAttribute('aria-hidden')).toBe('true');
      expect(slide2.hasAttribute('inert')).toBe(true);

      unmount();
    });

    it('includes accessible focus-visible classes on carousel navigation controls', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockSlides} />);

      const prevButton = (container.querySelector('button[aria-label="Diapositive précédente"]') ||
        container.querySelector('button[aria-label="Previous Slide"]')) as HTMLButtonElement;
      const nextButton = (container.querySelector('button[aria-label="Diapositive suivante"]') ||
        container.querySelector('button[aria-label="Next Slide"]')) as HTMLButtonElement;
      const dotButtons = container.querySelectorAll(
        'button[aria-label^="Aller à la diapositive"], button[aria-label^="Afficher la diapositive"], button[aria-label^="Go to slide"]'
      );

      expect(prevButton.className).toContain('focus-visible:ring-2');
      expect(nextButton.className).toContain('focus-visible:ring-2');
      expect(dotButtons.length).toBe(3);
      dotButtons.forEach((dot) => {
        expect(dot.className).toContain('focus-visible:ring-2');
      });

      unmount();
    });
  });

  describe('Issue #57: Category Filter aria-pressed State', () => {
    it('sets aria-pressed="true" on selected category and "false" on others', () => {
      const { container, unmount } = renderComponent(
        <CategoryFilter activeCategory="gâteau" onSelectCategory={() => {}} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(defaultCategories.length);

      const gateauBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Gâteaux') || btn.textContent?.includes('gâteau'));
      expect(gateauBtn).toBeDefined();
      expect(gateauBtn?.getAttribute('aria-pressed')).toBe('true');

      const otherButtons = Array.from(buttons).filter((btn) => btn !== gateauBtn);
      otherButtons.forEach((btn) => {
        expect(btn.getAttribute('aria-pressed')).toBe('false');
      });

      unmount();
    });

    it('triggers callback and toggles aria-pressed when a category is clicked', () => {
      function InteractiveTest() {
        const [active, setActive] = useState('all');
        return (
          <CategoryFilter
            activeCategory={active}
            onSelectCategory={(cat) => setActive(cat)}
          />
        );
      }

      const { container, unmount } = renderComponent(<InteractiveTest />);

      const buttons = container.querySelectorAll('button');
      const allBtn = buttons[0];
      const secondBtn = buttons[1];

      // Initially 'all' is selected
      expect(allBtn.getAttribute('aria-pressed')).toBe('true');
      expect(secondBtn.getAttribute('aria-pressed')).toBe('false');

      // Click second button
      act(() => {
        secondBtn.click();
      });

      expect(allBtn.getAttribute('aria-pressed')).toBe('false');
      expect(secondBtn.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('supports modal variant with proper focus-visible styles', () => {
      const { container, unmount } = renderComponent(
        <CategoryFilter
          activeCategory="all"
          onSelectCategory={() => {}}
          variant="modal"
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.className).toContain('focus-visible:ring-2');
        expect(btn.className).toContain('focus-visible:ring-primary');
        expect(btn.hasAttribute('aria-pressed')).toBe(true);
      });

      unmount();
    });
  });

  describe('Issue #16: Carousel URL Validation & Open Redirect / XSS Prevention', () => {
    it('rejects dangerous javascript:, data:, vbscript:, and file: schemes', () => {
      expect(sanitizeSlideUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeSlideUrl('JAVASCRIPT:alert(document.cookie)')).toBeNull();
      expect(sanitizeSlideUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeSlideUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeSlideUrl('file:///etc/passwd')).toBeNull();
    });

    it('rejects protocol-relative URLs and empty/hash links', () => {
      expect(sanitizeSlideUrl('//attacker.com/exploit')).toBeNull();
      expect(sanitizeSlideUrl('')).toBeNull();
      expect(sanitizeSlideUrl('   ')).toBeNull();
      expect(sanitizeSlideUrl('#')).toBeNull();
      expect(sanitizeSlideUrl(null)).toBeNull();
      expect(sanitizeSlideUrl(undefined)).toBeNull();
    });

    it('allows valid relative internal paths', () => {
      expect(sanitizeSlideUrl('/our-product/bonbons')).toBe('/our-product/bonbons');
      expect(sanitizeSlideUrl('/contact')).toBe('/contact');
      expect(sanitizeSlideUrl('/a-propos')).toBe('/a-propos');
    });

    it('rejects unvalidated external domains and insecure http schemes (Issue #44)', () => {
      expect(sanitizeSlideUrl('https://example.com/promo')).toBeNull();
      expect(sanitizeSlideUrl('http://example.com/promo')).toBeNull();
      expect(sanitizeSlideUrl('https://evil-phishing.com/steal')).toBeNull();
      expect(sanitizeSlideUrl('https://candyeco.dz/promo')).toBe('https://candyeco.dz/promo');
    });

    it('rejects invalid or malformed URL strings', () => {
      expect(sanitizeSlideUrl('ht tp://invalid.com')).toBeNull();
      expect(sanitizeSlideUrl('not-a-valid-url')).toBeNull();
    });

    it('HeroCarousel renders safe link and neutralizes malicious javascript: URL', () => {
      const maliciousSlide: CarouselSlide = {
        id: 'slide-bad',
        title: 'Malicious Slide',
        description: 'Test payload',
        imageUrl: '/test.jpg',
        linkUrl: 'javascript:alert(1)',
      };

      const { container, unmount } = renderComponent(<HeroCarousel slides={[maliciousSlide]} />);
      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        expect(link.getAttribute('href')).not.toBe('javascript:alert(1)');
      });
      unmount();
    });
  });
});

