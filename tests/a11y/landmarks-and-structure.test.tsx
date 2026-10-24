// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Outfit: () => ({ variable: 'outfit' }),
  Fredoka: () => ({ variable: 'fredoka' }),
}));

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

// Mock useProducts and useConfig
vi.mock('@/lib/hooks/use-products', () => ({
  useProducts: () => ({ data: [], isLoading: false }),
  useInfiniteProducts: () => ({
    data: { pages: [] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));

vi.mock('@/lib/hooks/use-config', () => ({
  useConfig: () => ({
    data: { store_enabled: true },
    isLoading: false,
  }),
}));

import RootLayout, { viewport } from '@/app/layout';
import HomePage from '@/app/home/page';
import OurProductPage from '@/app/our-product/page';
import HeroCarousel from '@/components/home/HeroCarousel';
import ProductCard from '@/components/ProductCard';
import FaqSection from '@/components/home/FaqSection';
import FaqAccordion from '@/components/faq/FaqAccordion';

// Mock home service
vi.mock('@/lib/services/home.service', () => ({
  getHomePageData: vi.fn().mockResolvedValue({
    featuredProducts: [],
    newProducts: [],
    popularProducts: [],
    carouselSlides: [],
    story: { title: 'Notre Histoire', description: 'Description', imageUrl: '' },
    faqs: [
      { id: 'faq-1', question: 'Question 1 ?', answer: 'Réponse 1' },
      { id: 'faq-2', question: 'Question 2 ?', answer: 'Réponse 2' },
    ],
  }),
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

describe('Issues #1, #34, and #127: Storefront Accessibility Landmarks, Hierarchy & Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    global.IntersectionObserver = MockIntersectionObserver as any;
  });

  describe('Issue #34: Skip Link and Viewport Zoom', () => {
    it('provides an accessible "Skip to main content" link pointing to #main-content', () => {
      const { container, unmount } = renderComponent(
        <RootLayout>
          <main id="main-content">Contenu</main>
        </RootLayout>
      );

      const skipLink = container.querySelector('a[href="#main-content"]');
      expect(skipLink).not.toBeNull();
      expect(skipLink?.textContent?.trim()).toMatch(/passer au contenu principal|skip to main content/i);
      expect(skipLink?.className).toContain('sr-only');
      expect(skipLink?.className).toContain('focus:not-sr-only');

      unmount();
    });

    it('ensures viewport does not restrict mobile zooming (user-scalable is not false)', () => {
      expect(viewport.userScalable).not.toBe(false);
      expect((viewport as any).userScalable).not.toBe('no');
      if (viewport.maximumScale !== undefined) {
        expect(viewport.maximumScale).toBeGreaterThan(1);
      }
    });
  });

  describe('Issue #1: Permanent H1 Heading outside transient carousel slides', () => {
    it('verifies a permanent <h1> heading exists in the semantic document structure of HomePage outside the carousel', async () => {
      const pageJsx = await HomePage();
      const { container, unmount } = renderComponent(pageJsx);

      // Verify that an H1 exists permanently inside main landmark outside carousel section
      const main = container.querySelector('main#main-content');
      expect(main).not.toBeNull();

      // Search for h1 heading outside the carousel section
      const h1Headings = main?.querySelectorAll('h1');
      expect(h1Headings?.length).toBeGreaterThanOrEqual(1);

      // Check that at least one permanent h1 is outside the carousel
      const carouselSection = main?.querySelector('section.relative.isolate');
      const h1OutsideCarousel = Array.from(h1Headings || []).find(
        (h1) => !carouselSection || !carouselSection.contains(h1)
      );
      expect(h1OutsideCarousel).toBeDefined();
      expect(h1OutsideCarousel?.textContent?.trim().length).toBeGreaterThan(0);

      unmount();
    });

    it('clarifies repeated product link texts with descriptive accessible labels', () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'Tarte Citron Meringuée',
        slug: 'tarte-citron',
        price: '5.50',
        imageUrl: '/lemon.jpg',
        category: 'Pâtisserie',
        description: 'Délicieuse tarte au citron.',
        state: 'exist',
      };

      const { container, unmount } = renderComponent(<ProductCard product={mockProduct} />);

      const readMoreLink = Array.from(container.querySelectorAll('a')).find(
        (a) => a.getAttribute('href') === '/our-product/tarte-citron' && a.textContent?.includes('Read More') || a.textContent?.includes('En savoir plus') || a.getAttribute('aria-label')
      );
      expect(readMoreLink).toBeDefined();

      // The link must have an accessible aria-label or accessible text mentioning the product title
      const label = readMoreLink?.getAttribute('aria-label') || readMoreLink?.textContent;
      expect(label).toContain('Tarte Citron Meringuée');

      unmount();
    });
  });

  describe('Issue #127: FAQ Accordion aria-controls and aria-expanded attributes', () => {
    const mockFaqs = [
      { id: 'f-1', question: 'Comment commander ?', answer: 'En ligne via le panier.' },
      { id: 'f-2', question: 'Délai ?', answer: '24 heures.' },
    ];

    it('manages aria-controls and aria-expanded on FaqSection accordion buttons', () => {
      const { container, unmount } = renderComponent(<FaqSection faqs={mockFaqs} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);

      expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
      expect(buttons[0].getAttribute('aria-controls')).toBe('faq-answer-f-1');

      act(() => {
        buttons[0].click();
      });

      expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
      expect(buttons[1].getAttribute('aria-expanded')).toBe('false');

      unmount();
    });

    it('manages aria-controls and aria-expanded on FaqAccordion accordion buttons', () => {
      const { container, unmount } = renderComponent(<FaqAccordion faqs={mockFaqs} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);

      expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
      expect(buttons[0].getAttribute('aria-controls')).toBe('faq-answer-f-1');

      act(() => {
        buttons[0].click();
      });

      expect(buttons[0].getAttribute('aria-expanded')).toBe('true');

      unmount();
    });
  });

  describe('Issue #133: Heading Hierarchy & Semantic H1 Landmark on /our-product', () => {
    it('renders a visible <h1> landmark and <h2> filter landmark on OurProductPage', () => {
      const { container, unmount } = renderComponent(<OurProductPage />);

      const main = container.querySelector('main#main-content');
      expect(main).not.toBeNull();

      // Heading 1 check
      const h1 = main?.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1?.textContent?.trim()).toBe('Nos Produits');
      expect(h1?.className).not.toContain('sr-only');

      // Heading 2 check ensuring hierarchy before h3 product cards
      const h2 = main?.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2?.textContent?.trim()).toMatch(/recherche et filtres/i);

      unmount();
    });
  });

  describe('Issue #126 & #127: French Carousel Controls and Non-destructive Heading Structure', () => {
    const mockCarouselSlides = [
      {
        id: 's-1',
        title: 'Douceurs Fraîches',
        description: 'Faits maison chaque matin.',
        imageUrl: '/test.jpg',
        primaryLink: { label: 'Commander', href: '/our-product' },
      },
      {
        id: 's-2',
        title: 'Pâtisseries Fines',
        description: 'Ingrédients biologiques.',
        imageUrl: '/test2.jpg',
        primaryLink: { label: 'Découvrir', href: '/our-product' },
      },
    ];

    it('provides French aria-labels on Previous and Next buttons and slide indicators', () => {
      const { container, unmount } = renderComponent(<HeroCarousel slides={mockCarouselSlides} />);

      const prevBtn = container.querySelector('button[aria-label="Diapositive précédente"]');
      const nextBtn = container.querySelector('button[aria-label="Diapositive suivante"]');
      expect(prevBtn).not.toBeNull();
      expect(nextBtn).not.toBeNull();

      // Dot indicators container
      const dotGroup = container.querySelector('div[role="group"][aria-label="Choisir une diapositive"]');
      expect(dotGroup).not.toBeNull();

      // Dot buttons have French labels
      const dotButtons = dotGroup?.querySelectorAll('button');
      expect(dotButtons?.length).toBe(mockCarouselSlides.length);
      expect(dotButtons?.[0]?.getAttribute('aria-label')).toBe('Aller à la diapositive 1 sur 2');
      expect(dotButtons?.[1]?.getAttribute('aria-label')).toBe('Aller à la diapositive 2 sur 2');

      // Slide titles use h2 so active slide cycling does not hide the page h1
      const h1InsideCarousel = container.querySelectorAll('h1');
      expect(h1InsideCarousel.length).toBe(0);

      const h2InsideCarousel = container.querySelectorAll('h2');
      expect(h2InsideCarousel.length).toBe(2);

      unmount();
    });
  });
});

