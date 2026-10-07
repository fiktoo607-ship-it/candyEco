// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { containsArabic, formatLocalizedText, LocalizedSpan } from '@/lib/a11y';
import ProductCard from '@/components/ProductCard';
import { ProductTagsEditor } from '@/components/dashbord/products/ProductTagsEditor';
import fs from 'fs';
import path from 'path';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock useLogin hook
vi.mock('@/lib/hooks/use-login', () => ({
  useLogin: () => ({
    formData: { phone: '', password: '' },
    handleInputChange: vi.fn(),
    showPassword: false,
    toggleShowPassword: vi.fn(),
    loading: false,
    googleLoading: false,
    errorMessage: '',
    setErrorMessage: vi.fn(),
    isInitialLoading: false,
    clientDevice: null,
    slotsOccupied: 0,
    canViewDetails: false,
    showAdminsDetails: false,
    toggleShowAdminsDetails: vi.fn(),
    activeSessions: [],
    handleCredentialsLogin: vi.fn((e) => e.preventDefault()),
    handleGoogleLogin: vi.fn(),
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderComponent(ui: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, unmount: () => act(() => root.unmount()) };
}

describe('A11y Fixes Verification (Issues #73, #72, #58)', () => {
  describe('Issue #72: Arabic text detection and lang="ar" dir="rtl" wrapping', () => {
    it('containsArabic should correctly identify Arabic strings', () => {
      expect(containsArabic('شخشوخة')).toBe(true);
      expect(containsArabic('حلويات تقليدية')).toBe(true);
      expect(containsArabic('Croissant aux amandes')).toBe(false);
      expect(containsArabic('Gâteau 100% bio')).toBe(false);
      expect(containsArabic('')).toBe(false);
      expect(containsArabic(null)).toBe(false);
      expect(containsArabic(undefined)).toBe(false);
    });

    it('formatLocalizedText wraps Arabic in span with lang="ar" and dir="rtl"', () => {
      const arabicNode = formatLocalizedText('بقلاوة');
      const { container: arContainer } = renderComponent(<div>{arabicNode}</div>);
      const span = arContainer.querySelector('span[lang="ar"]');
      expect(span).toBeTruthy();
      expect(span?.getAttribute('dir')).toBe('rtl');
      expect(span?.textContent).toBe('بقلاوة');

      const frenchNode = formatLocalizedText('Baguette');
      const { container: frContainer } = renderComponent(<div>{frenchNode}</div>);
      expect(frContainer.querySelector('span[lang="ar"]')).toBeNull();
      expect(frContainer.textContent).toBe('Baguette');
    });

    it('ProductCard renders Arabic titles and tags with lang="ar" dir="rtl"', () => {
      const mockProduct = {
        id: 'p-1',
        title: 'شخشوخة قسنطينية',
        slug: 'chakhchoukha',
        price: '15.00',
        category: 'Plat traditionnel',
        imageUrl: '/test.jpg',
        description: 'طبق تقليدي جزائري أصيل',
        state: 'exist',
        tags: ['تقليدي', 'bio'],
      };

      const { container } = renderComponent(<ProductCard product={mockProduct} />);

      // Title should have lang="ar"
      const titleSpan = container.querySelector('h3 span[lang="ar"][dir="rtl"]');
      expect(titleSpan).toBeTruthy();
      expect(titleSpan?.textContent).toBe('شخشوخة قسنطينية');

      // Description should have lang="ar"
      const descSpan = container.querySelector('p span[lang="ar"][dir="rtl"]');
      expect(descSpan).toBeTruthy();
      expect(descSpan?.textContent).toBe('طبق تقليدي جزائري أصيل');

      // Tag 'تقليدي' should have lang="ar"
      const arabicTagSpan = container.querySelector('span[lang="ar"][dir="rtl"]');
      expect(arabicTagSpan).toBeTruthy();
      expect(container.textContent).toContain('#تقليدي');
    });

    it('ProductTagsEditor renders Arabic tags with lang="ar" dir="rtl"', () => {
      const { container } = renderComponent(
        <ProductTagsEditor
          tags={['حلوى', 'chocolat']}
          newTagInput=""
          setNewTagInput={vi.fn()}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
          onTagKeyDown={vi.fn()}
        />
      );

      const arabicTag = container.querySelector('span[lang="ar"][dir="rtl"]');
      expect(arabicTag).toBeTruthy();
      expect(arabicTag?.textContent).toBe('حلوى');
    });
  });

  describe('Issue #58: Login page icon button control labels and aria-hidden', () => {
    it('login page source contains explicit aria-label for controls and aria-hidden on Material icons', () => {
      const loginPagePath = path.join(process.cwd(), 'app/login/page.tsx');
      const loginContent = fs.readFileSync(loginPagePath, 'utf8');

      // Password toggle button has clear aria-label
      expect(loginContent).toContain('aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}');

      // Return button has clear aria-label
      expect(loginContent).toContain('aria-label="Retour à l\'accueil"');

      // Material icon inside password toggle has aria-hidden="true"
      expect(loginContent).toContain('aria-hidden="true"');
      expect(loginContent).toContain('{showPassword ? "visibility_off" : "visibility"}');
    });
  });

  describe('Issue #73: Keyboard focus-visible indicators in app/globals.css', () => {
    it('globals.css defines :focus-visible ring indicators', () => {
      const globalsCssPath = path.join(process.cwd(), 'app/globals.css');
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('ring-primary');
    });

    it('login and register page inputs & buttons include focus-visible classes', () => {
      const loginPagePath = path.join(process.cwd(), 'app/login/page.tsx');
      const loginContent = fs.readFileSync(loginPagePath, 'utf8');
      expect(loginContent).toContain('focus-visible:outline-none');
      expect(loginContent).toContain('focus-visible:ring-2');
      expect(loginContent).toContain('focus-visible:ring-primary');

      const registerPagePath = path.join(process.cwd(), 'app/register/page.tsx');
      const registerContent = fs.readFileSync(registerPagePath, 'utf8');
      expect(registerContent).toContain('focus-visible:outline-none');
      expect(registerContent).toContain('focus-visible:ring-2');
      expect(registerContent).toContain('focus-visible:ring-primary');
    });
  });
});
