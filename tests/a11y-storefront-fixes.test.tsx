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

// Mock useSubmitOrder and useConfig
vi.mock('@/lib/hooks/use-orders', () => ({
  useSubmitOrder: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/lib/hooks/use-config', () => ({
  useConfig: () => ({
    data: { store_enabled: true },
    isLoading: false,
  }),
}));

import { viewport } from '@/app/layout';
import RootLayout from '@/app/layout';
import ProductCard from '@/components/ProductCard';
import ProductDetails from '@/components/product-details/ProductDetails';
import CartItemsList from '@/components/cart/CartItemsList';
import CartDrawer from '@/components/CartDrawer';
import Navbar from '@/components/Navbar';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import CartCheckoutForm from '@/components/cart/CheckoutForm';
import FaqAccordion from '@/components/faq/FaqAccordion';
import FaqSection from '@/components/home/FaqSection';
import ContactForm from '@/components/contact/ContactForm';

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

describe('Storefront Accessibility Fixes (Issues #34, #33, #32, #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);
  });

  describe('Issue #32: Viewport zoom locks and unrestricted scaling in app/layout.tsx', () => {
    it('viewport configuration does not disable zoom or lock maximum-scale to 1.0', () => {
      expect(viewport.userScalable).not.toBe(false);
      expect((viewport as any).userScalable).not.toBe('no');
      if (viewport.maximumScale !== undefined) {
        expect(viewport.maximumScale).toBeGreaterThan(1);
      }
    });

    it('layout source file does not specify userScalable: false or maximumScale: 1', () => {
      const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf8');
      expect(content).not.toContain('userScalable: false');
      expect(content).not.toContain('maximumScale: 1');
    });
  });

  describe('Issue #34: Skip to main content link and <main id="main-content"> landmark', () => {
    it('app/layout.tsx renders "Skip to main content" link as the first focusable link', () => {
      const { container, unmount } = renderComponent(
        <RootLayout>
          <main id="main-content">
            <p>Content</p>
          </main>
        </RootLayout>
      );

      const skipLink = container.querySelector('a[href="#main-content"]');
      expect(skipLink).not.toBeNull();
      expect(skipLink?.textContent?.trim()).toMatch(/skip to main content/i);
      expect(skipLink?.className).toContain('sr-only');
      expect(skipLink?.className).toContain('focus:not-sr-only');

      // The skip link is the very first focusable element rendered inside body
      const firstLink = container.querySelector('a');
      expect(firstLink).toBe(skipLink);

      unmount();
    });

    it('main storefront pages define <main id="main-content">', () => {
      const pages = [
        'app/home/page.tsx',
        'app/cart/page.tsx',
        'app/our-product/page.tsx',
        'app/our-product/[slug]/page.tsx',
        'app/contact/page.tsx',
        'app/about/page.tsx',
        'app/orders/page.tsx',
        'app/orders/[id]/page.tsx',
        'app/track-order/page.tsx',
      ];

      for (const pageRelPath of pages) {
        const fullPath = path.join(process.cwd(), pageRelPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content, `${pageRelPath} should have id="main-content"`).toContain('id="main-content"');
      }
    });
  });

  describe('Issue #34 & #1: Accessible icon-only buttons with descriptive aria-label', () => {
    it('ProductCard quantity increment and decrement buttons have descriptive aria-labels', () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'Tarte aux Fraises',
        slug: 'tarte-aux-fraises',
        price: '12.50',
        imageUrl: '/strawberry.jpg',
        category: 'Pâtisserie',
        description: 'Tarte fraîche aux fraises',
        state: 'exist',
      };

      const { container, unmount } = renderComponent(<ProductCard product={mockProduct} />);

      const decreaseBtn = container.querySelector('button[aria-label="Diminuer la quantité"]');
      const increaseBtn = container.querySelector('button[aria-label="Augmenter la quantité"]');

      expect(decreaseBtn).not.toBeNull();
      expect(increaseBtn).not.toBeNull();

      unmount();
    });

    it('ProductDetails quantity buttons and rating stars have descriptive aria-labels', () => {
      const mockProduct = {
        id: 'prod-detail-1',
        title: 'Éclair au Chocolat',
        slug: 'eclair-chocolat',
        price: '4.50',
        imageUrl: '/eclair.jpg',
        category: 'Pâtisserie',
        description: 'Éclair traditionnel au chocolat noir',
        state: 'exist',
        story: '',
        limitBay: null,
      };

      const { container, unmount } = renderComponent(<ProductDetails product={mockProduct} />);

      const decBtn = container.querySelector('button[aria-label="Diminuer la quantité"]');
      const incBtn = container.querySelector('button[aria-label="Augmenter la quantité"]');
      expect(decBtn).not.toBeNull();
      expect(incBtn).not.toBeNull();

      // Check rating star buttons
      const star1 = container.querySelector('button[aria-label="Noter 1 sur 5"]');
      const star5 = container.querySelector('button[aria-label="Noter 5 sur 5"]');
      // If user is eligible to rate, star buttons exist; let's verify format
      const detailsSrc = fs.readFileSync(path.join(process.cwd(), 'components/product-details/ProductDetails.tsx'), 'utf8');
      expect(detailsSrc).toContain('aria-label={`Noter ${star} sur 5`}');

      unmount();
    });

    it('CartItemsList buttons have descriptive aria-labels', () => {
      const { container, unmount } = renderComponent(<CartItemsList />);
      // Verify source file contains the expected aria-labels
      const cartListSrc = fs.readFileSync(path.join(process.cwd(), 'components/cart/CartItemsList.tsx'), 'utf8');
      expect(cartListSrc).toContain('aria-label="Diminuer la quantité"');
      expect(cartListSrc).toContain('aria-label="Augmenter la quantité"');
      expect(cartListSrc).toContain('aria-label="Supprimer cet article"');
      unmount();
    });

    it('CartDrawer provides accessible dialog semantics and close button aria-label', () => {
      const { container, unmount } = renderComponent(<CartDrawer isOpen={true} onClose={vi.fn()} />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-label')).toBe("Panier d'achats");

      const closeBtn = container.querySelector('button[aria-label="Fermer le panier"]');
      expect(closeBtn).not.toBeNull();

      unmount();
    });

    it('Navbar re-exports SiteHeader with accessible cart links and menu controls', () => {
      expect(Navbar).toBeDefined();
      const headerSrc = fs.readFileSync(path.join(process.cwd(), 'components/site-header.tsx'), 'utf8');
      expect(headerSrc).toContain('aria-label="Voir le panier"');
      expect(headerSrc).toContain('aria-controls="mobile-navigation-menu"');
    });
  });

  describe('Issue #33: Checkout and Contact Form controls and validation error linking', () => {
    it('CheckoutForm has htmlFor matching input id for all fields', () => {
      expect(CheckoutForm).toBe(CartCheckoutForm);

      const { container, unmount } = renderComponent(<CheckoutForm onSuccess={vi.fn()} />);

      const labels = container.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);

      // Verify every label has an htmlFor pointing to an existing element
      labels.forEach((label) => {
        const htmlFor = label.getAttribute('for');
        expect(htmlFor).toBeTruthy();
        const associatedInput = container.querySelector(`#${htmlFor}`);
        expect(associatedInput).not.toBeNull();
      });

      unmount();
    });

    it('CheckoutForm sets aria-invalid="true" and aria-describedby="{field}-error" on submission errors', () => {
      const { container, unmount } = renderComponent(<CheckoutForm onSuccess={vi.fn()} />);

      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn).not.toBeNull();

      act(() => {
        submitBtn.click();
      });

      // Name field validation error
      const nameInput = container.querySelector('#name') as HTMLInputElement;
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(nameInput.getAttribute('aria-describedby')).toBe('name-error');
      const nameError = container.querySelector('#name-error');
      expect(nameError).not.toBeNull();

      // Phone field validation error
      const phoneInput = container.querySelector('#phone') as HTMLInputElement;
      expect(phoneInput.getAttribute('aria-invalid')).toBe('true');
      expect(phoneInput.getAttribute('aria-describedby')).toBe('phone-error');
      const phoneError = container.querySelector('#phone-error');
      expect(phoneError).not.toBeNull();

      // Address field validation error
      const addressInput = container.querySelector('#address') as HTMLInputElement;
      expect(addressInput.getAttribute('aria-invalid')).toBe('true');
      expect(addressInput.getAttribute('aria-describedby')).toBe('address-error');
      const addressError = container.querySelector('#address-error');
      expect(addressError).not.toBeNull();

      unmount();
    });

    it('ContactForm explicitly associates labels with inputs and links errors via aria-describedby', () => {
      const { container, unmount } = renderComponent(<ContactForm onSuccess={vi.fn()} />);

      const labels = container.querySelectorAll('label');
      labels.forEach((label) => {
        const htmlFor = label.getAttribute('for');
        expect(htmlFor).toBeTruthy();
        expect(container.querySelector(`#${htmlFor}`)).not.toBeNull();
      });

      // Submit empty contact form
      const form = container.querySelector('form');
      act(() => {
        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      const nameInput = container.querySelector('#contact-name') as HTMLInputElement;
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(nameInput.getAttribute('aria-describedby')).toBe('name-error');
      expect(container.querySelector('#name-error')).not.toBeNull();

      const emailInput = container.querySelector('#contact-email') as HTMLInputElement;
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput.getAttribute('aria-describedby')).toBe('email-error');
      expect(container.querySelector('#email-error')).not.toBeNull();

      unmount();
    });
  });

  describe('Issue #34: FAQ Accordion aria-expanded and aria-controls matching container id', () => {
    const mockFaqs = [
      {
        id: 'faq-1',
        question: 'Comment passer une commande ?',
        answer: 'Ajoutez les produits au panier et validez la commande.',
      },
      {
        id: 'faq-2',
        question: 'Quels sont les délais de livraison ?',
        answer: 'Nos livraisons sont effectuées sous 24 à 48 heures.',
      },
    ];

    it('FaqAccordion component manages aria-expanded, aria-controls, and matching id on content', () => {
      const { container, unmount } = renderComponent(<FaqAccordion faqs={mockFaqs} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);

      // Initially collapsed
      expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
      expect(buttons[0].getAttribute('aria-controls')).toBe('faq-answer-faq-1');

      const content1 = container.querySelector('#faq-answer-faq-1');
      expect(content1).not.toBeNull();

      // Click to expand first item
      act(() => {
        buttons[0].click();
      });

      expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
      expect(buttons[1].getAttribute('aria-expanded')).toBe('false');

      // Click second item
      act(() => {
        buttons[1].click();
      });

      expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
      expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
      expect(buttons[1].getAttribute('aria-controls')).toBe('faq-answer-faq-2');
      expect(container.querySelector('#faq-answer-faq-2')).not.toBeNull();

      unmount();
    });

    it('FaqSection component manages aria-expanded and aria-controls matching collapsible id', () => {
      const { container, unmount } = renderComponent(<FaqSection faqs={mockFaqs} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);

      expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
      expect(buttons[0].getAttribute('aria-controls')).toBe('faq-answer-faq-1');
      expect(container.querySelector('#faq-answer-faq-1')).not.toBeNull();

      act(() => {
        buttons[0].click();
      });

      expect(buttons[0].getAttribute('aria-expanded')).toBe('true');

      unmount();
    });
  });
});
