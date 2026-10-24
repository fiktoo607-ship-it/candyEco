// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewProductsSection from '@/components/home/NewProductsSection';
import PopularProductsSection from '@/components/home/PopularProductsSection';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const sampleProducts = [
  { id: '1', title: 'Product 1', slug: 'p1', price: '10', imageUrl: '/1.jpg', category: 'cat', description: 'Product description 1', state: 'exist' },
  { id: '2', title: 'Product 2', slug: 'p2', price: '20', imageUrl: '/2.jpg', category: 'cat', description: 'Product description 2', state: 'exist' },
  { id: '3', title: 'Product 3', slug: 'p3', price: '30', imageUrl: '/3.jpg', category: 'cat', description: 'Product description 3', state: 'exist' },
  { id: '4', title: 'Product 4', slug: 'p4', price: '40', imageUrl: '/4.jpg', category: 'cat', description: 'Product description 4', state: 'exist' },
  { id: '5', title: 'Product 5', slug: 'p5', price: '50', imageUrl: '/5.jpg', category: 'cat', description: 'Product description 5', state: 'exist' },
];

describe('Carousel Resize Guard on Mobile Viewports (Height vs Width changes)', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
      root = null;
      container = null;
    }
  });

  it('FeaturedProducts does not reset current slide when mobile scroll triggers height-only resize', async () => {
    // Set initial mobile viewport
    window.innerWidth = 375;
    window.innerHeight = 667;

    await act(async () => {
      root!.render(<FeaturedProducts products={sampleProducts} />);
    });

    // Check indicator dots exist
    const dots = container!.querySelectorAll('button[aria-label^="Aller à la diapositive"], button[aria-label^="Go to slide"]');
    expect(dots.length).toBe(sampleProducts.length);

    // Navigate to slide 3 (index 2) by clicking the 3rd dot button
    await act(async () => {
      dots[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Verify slide 3 is now active
    expect(dots[2].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).toBeNull();

    // Simulate mobile browser scrolling: address bar hides, changing innerHeight from 667 to 720, but innerWidth remains 375
    window.innerHeight = 720;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    // Slide 3 should remain active and NOT be reset to slide 1 / 0
    expect(dots[2].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).toBeNull();

    // Now simulate genuine width resize (e.g. phone orientation rotated to landscape 667px width)
    window.innerWidth = 700;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    // Verify itemsPerView updated for tablet/landscape (2 items per view: card width 50%)
    const slideCards = container!.querySelectorAll('.flex-shrink-0') as NodeListOf<HTMLElement>;
    expect(slideCards[0]?.style.width).toBe('50%');
  });

  it('NewProductsSection does not reset current slide on mobile height-only scroll events', async () => {
    window.innerWidth = 375;
    window.innerHeight = 667;

    await act(async () => {
      root!.render(<NewProductsSection products={sampleProducts} />);
    });

    const dots = container!.querySelectorAll('button[aria-label^="Aller à la diapositive"], button[aria-label^="Go to slide"]');
    expect(dots.length).toBe(sampleProducts.length);

    // Advance to slide 4 (index 3)
    await act(async () => {
      dots[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dots[3].getAttribute('aria-current')).toBe('true');

    // Address bar shows/hides, triggering resize
    window.innerHeight = 600;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    // Current slide is retained
    expect(dots[3].getAttribute('aria-current')).toBe('true');
  });

  it('PopularProductsSection does not reset current slide on mobile height-only scroll events', async () => {
    window.innerWidth = 375;
    window.innerHeight = 667;

    await act(async () => {
      root!.render(<PopularProductsSection products={sampleProducts} />);
    });

    const dots = container!.querySelectorAll('button[aria-label^="Aller à la diapositive"], button[aria-label^="Go to slide"]');
    expect(dots.length).toBe(sampleProducts.length);

    // Advance to slide 2 (index 1)
    await act(async () => {
      dots[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dots[1].getAttribute('aria-current')).toBe('true');

    // Height-only resize event
    window.innerHeight = 800;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    // Current slide is retained
    expect(dots[1].getAttribute('aria-current')).toBe('true');
  });
});
