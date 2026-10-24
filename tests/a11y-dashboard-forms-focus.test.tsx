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

import { ProductTagsEditor } from '@/components/dashbord/products/ProductTagsEditor';
import { DeliveryForm, LieuPriceModal } from '@/components/dashbord/helpers/DeliverySectionHelpers';
import { QnaModal, QnaFilters } from '@/components/dashbord/helpers/QnaSectionHelpers';
import { FidelityConfigModal } from '@/components/dashbord/users/FidelityConfigModal';
import { ProductBasicInfo } from '@/components/dashbord/products/ProductBasicInfo';
import { ProductDetailsInfo } from '@/components/dashbord/products/ProductDetailsInfo';
import { ProductDescriptionStory } from '@/components/dashbord/products/ProductDescriptionStory';
import { ProductMetrics } from '@/components/dashbord/products/ProductMetrics';
import { SlideModal } from '@/components/dashbord/cms/SlideModal';

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

describe('Dashboard Forms & Focus Accessibility (Issues #132, #73, #124)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vipThreshold: 200, fideleThreshold: 100 }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Issue #132: Form inputs in modals/forms must be explicitly associated with <label> via htmlFor/id', () => {
    it('ProductTagsEditor associates tag label with text input via htmlFor and id', () => {
      const { container, unmount } = renderComponent(
        <ProductTagsEditor
          tags={['Bio', 'Chocolat']}
          newTagInput=""
          setNewTagInput={vi.fn()}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
          onTagKeyDown={vi.fn()}
        />
      );

      const label = container.querySelector('label[for="product-tag-input"]');
      const input = container.querySelector('input#product-tag-input');
      expect(label).not.toBeNull();
      expect(input).not.toBeNull();
      expect(label?.getAttribute('for')).toBe('product-tag-input');
      expect(input?.getAttribute('id')).toBe('product-tag-input');

      unmount();
    });

    it('DeliveryForm associates all form fields with labels via htmlFor/id', () => {
      const { container, unmount } = renderComponent(
        <DeliveryForm
          isEditing={false}
          submitError={null}
          submitLoading={false}
          name="Livraison Express"
          setName={vi.fn()}
          description="Livraison en 24h"
          setDescription={vi.fn()}
          price="500"
          setPrice={vi.fn()}
          homePrice="500"
          setHomePrice={vi.fn()}
          stockPrice="300"
          setStockPrice={vi.fn()}
          active={true}
          setActive={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const nameLabel = container.querySelector('label[for="delivery-method-name"]');
      const nameInput = container.querySelector('input#delivery-method-name');
      expect(nameLabel).not.toBeNull();
      expect(nameInput).not.toBeNull();

      const descLabel = container.querySelector('label[for="delivery-method-description"]');
      const descInput = container.querySelector('textarea#delivery-method-description');
      expect(descLabel).not.toBeNull();
      expect(descInput).not.toBeNull();

      const homePriceLabel = container.querySelector('label[for="delivery-method-home-price"]');
      const homePriceInput = container.querySelector('input#delivery-method-home-price');
      expect(homePriceLabel).not.toBeNull();
      expect(homePriceInput).not.toBeNull();

      const stockPriceLabel = container.querySelector('label[for="delivery-method-stock-price"]');
      const stockPriceInput = container.querySelector('input#delivery-method-stock-price');
      expect(stockPriceLabel).not.toBeNull();
      expect(stockPriceInput).not.toBeNull();

      unmount();
    });

    it('LieuPriceModal associates price inputs with labels via htmlFor/id', () => {
      const mockMethod = {
        id: 'm1',
        name: 'Express Alger',
        description: 'Zone Alger',
        price: 400,
        homePrice: 400,
        stockPrice: 250,
        active: true,
      };

      const { container, unmount } = renderComponent(
        <LieuPriceModal
          isOpen={true}
          method={mockMethod}
          homePrice="400"
          setHomePrice={vi.fn()}
          stockPrice="250"
          setStockPrice={vi.fn()}
          submitLoading={false}
          submitError={null}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const homeLabel = container.querySelector('label[for="lieu-home-price"]');
      const homeInput = container.querySelector('input#lieu-home-price');
      expect(homeLabel).not.toBeNull();
      expect(homeInput).not.toBeNull();

      const stockLabel = container.querySelector('label[for="lieu-stock-price"]');
      const stockInput = container.querySelector('input#lieu-stock-price');
      expect(stockLabel).not.toBeNull();
      expect(stockInput).not.toBeNull();

      unmount();
    });

    it('QnaModal and QnaFilters associate inputs/textareas with labels via htmlFor/id', () => {
      const { container: modalContainer, unmount: unmountModal } = renderComponent(
        <QnaModal
          isOpen={true}
          modalMode="edit"
          questionText="Comment commander ?"
          setQuestionText={vi.fn()}
          answerText="Ajoutez au panier et validez."
          setAnswerText={vi.fn()}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const questionLabel = modalContainer.querySelector('label[for="qna-question"]');
      const questionTextarea = modalContainer.querySelector('textarea#qna-question');
      expect(questionLabel).not.toBeNull();
      expect(questionTextarea).not.toBeNull();

      const answerLabel = modalContainer.querySelector('label[for="qna-answer"]');
      const answerTextarea = modalContainer.querySelector('textarea#qna-answer');
      expect(answerLabel).not.toBeNull();
      expect(answerTextarea).not.toBeNull();

      unmountModal();

      const { container: filterContainer, unmount: unmountFilter } = renderComponent(
        <QnaFilters
          searchQuery=""
          setSearchQuery={vi.fn()}
          onOpenCreate={vi.fn()}
        />
      );

      const searchLabel = filterContainer.querySelector('label[for="qna-search-input"]');
      const searchInput = filterContainer.querySelector('input#qna-search-input');
      expect(searchLabel).not.toBeNull();
      expect(searchInput).not.toBeNull();

      unmountFilter();
    });

    it('FidelityConfigModal associates all configuration inputs with labels via htmlFor/id', () => {
      const mockUsers = [
        { id: 'u1', name: 'Karim', email: 'karim@test.com', fidelityPoints: 120, fidelityStatus: 'VIP' },
      ];

      const { container, unmount } = renderComponent(
        <FidelityConfigModal
          isOpen={true}
          onClose={vi.fn()}
          users={mockUsers as any}
          onUpdateUserStatus={vi.fn()}
          onRefreshUsers={vi.fn()}
        />
      );

      const vipLabel = container.querySelector('label[for="fidelity-vip-threshold"]');
      const vipInput = container.querySelector('input#fidelity-vip-threshold');
      expect(vipLabel).not.toBeNull();
      expect(vipInput).not.toBeNull();

      const fideleLabel = container.querySelector('label[for="fidelity-fidele-threshold"]');
      const fideleInput = container.querySelector('input#fidelity-fidele-threshold');
      expect(fideleLabel).not.toBeNull();
      expect(fideleInput).not.toBeNull();

      const userSelectLabel = container.querySelector('label[for="fidelity-selected-user"]');
      const userSelect = container.querySelector('select#fidelity-selected-user');
      expect(userSelectLabel).not.toBeNull();
      expect(userSelect).not.toBeNull();

      unmount();
    });

    it('ProductBasicInfo, ProductDetailsInfo, ProductDescriptionStory, and ProductMetrics connect inputs to labels', () => {
      const { container: basicContainer, unmount: unmountBasic } = renderComponent(
        <ProductBasicInfo
          modalMode="create"
          title="Bonbons Fraise"
          slug="bonbons-fraise"
          price="500"
          category="Sucreries"
          setTitle={vi.fn()}
          setSlug={vi.fn()}
          setPrice={vi.fn()}
          setCategory={vi.fn()}
        />
      );

      expect(basicContainer.querySelector('label[for="product-title"]')).not.toBeNull();
      expect(basicContainer.querySelector('input#product-title')).not.toBeNull();
      expect(basicContainer.querySelector('label[for="product-slug"]')).not.toBeNull();
      expect(basicContainer.querySelector('input#product-slug')).not.toBeNull();
      expect(basicContainer.querySelector('label[for="product-price"]')).not.toBeNull();
      expect(basicContainer.querySelector('input#product-price')).not.toBeNull();
      expect(basicContainer.querySelector('label[for="product-category"]')).not.toBeNull();
      expect(basicContainer.querySelector('select#product-category')).not.toBeNull();

      unmountBasic();

      const { container: detailsContainer, unmount: unmountDetails } = renderComponent(
        <ProductDetailsInfo
          limitBay="10"
          state="exist"
          setLimitBay={vi.fn()}
          setState={vi.fn()}
        />
      );

      expect(detailsContainer.querySelector('label[for="product-limit-bay"]')).not.toBeNull();
      expect(detailsContainer.querySelector('input#product-limit-bay')).not.toBeNull();
      expect(detailsContainer.querySelector('label[for="product-state"]')).not.toBeNull();
      expect(detailsContainer.querySelector('select#product-state')).not.toBeNull();

      unmountDetails();

      const { container: descContainer, unmount: unmountDesc } = renderComponent(
        <ProductDescriptionStory
          description="Description test"
          story="Histoire test"
          setDescription={vi.fn()}
          setStory={vi.fn()}
        />
      );

      expect(descContainer.querySelector('label[for="product-description"]')).not.toBeNull();
      expect(descContainer.querySelector('textarea#product-description')).not.toBeNull();
      expect(descContainer.querySelector('label[for="product-story"]')).not.toBeNull();
      expect(descContainer.querySelector('textarea#product-story')).not.toBeNull();

      unmountDesc();

      const { container: metricsContainer, unmount: unmountMetrics } = renderComponent(
        <ProductMetrics
          visibility="public"
          setVisibility={vi.fn()}
        />
      );

      expect(metricsContainer.querySelector('label[for="product-visibility"]')).not.toBeNull();
      expect(metricsContainer.querySelector('input#product-visibility')).not.toBeNull();

      unmountMetrics();
    });

    it('SlideModal connects title, description, linkUrl, and image file inputs with labels', () => {
      const mockSlide = {
        id: 's-1',
        title: 'Promotion Été',
        description: 'Jusqu à -50%',
        linkUrl: '/promotions',
        imageUrl: '/test.jpg',
        order: 1,
      };

      const { container, unmount } = renderComponent(
        <SlideModal
          isOpen={true}
          onClose={vi.fn()}
          editingSlide={mockSlide}
          slideTitle="Promotion Été"
          setSlideTitle={vi.fn()}
          slideDescription="Jusqu à -50%"
          setSlideDescription={vi.fn()}
          slideLinkUrl="/promotions"
          setSlideLinkUrl={vi.fn()}
          slideImageUrl="/test.jpg"
          setSlideImageUrl={vi.fn()}
          isSlideUploading={false}
          slideUploadError={null}
          isSlideSubmitting={false}
          handleSlideImageUpload={vi.fn()}
          handleSlideSubmit={vi.fn()}
        />
      );

      expect(container.querySelector('label[for="slide-title"]')).not.toBeNull();
      expect(container.querySelector('input#slide-title')).not.toBeNull();
      expect(container.querySelector('label[for="slide-description"]')).not.toBeNull();
      expect(container.querySelector('textarea#slide-description')).not.toBeNull();
      expect(container.querySelector('label[for="slide-link-url"]')).not.toBeNull();
      expect(container.querySelector('input#slide-link-url')).not.toBeNull();
      expect(container.querySelector('label[for="slide-image-file"]')).not.toBeNull();
      expect(container.querySelector('input#slide-image-file')).not.toBeNull();

      unmount();
    });
  });

  describe('Issue #73: Global CSS and component-level focus-visible indicators', () => {
    it('app/globals.css provides robust :focus-visible rules with ring indicator for buttons, inputs, selects, textareas, and interactive roles', () => {
      const globalsCssPath = path.join(process.cwd(), 'app/globals.css');
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('ring-2');
      expect(cssContent).toContain('ring-primary');
      expect(cssContent).toContain('ring-offset-2');
      expect(cssContent).toContain('button:focus-visible');
      expect(cssContent).toContain('input:focus-visible');
      expect(cssContent).toContain('select:focus-visible');
      expect(cssContent).toContain('textarea:focus-visible');
    });

    it('dashboard inputs include explicit focus-visible classes', () => {
      const { container: tagsContainer, unmount: unmountTags } = renderComponent(
        <ProductTagsEditor
          tags={[]}
          newTagInput=""
          setNewTagInput={vi.fn()}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
          onTagKeyDown={vi.fn()}
        />
      );

      const tagInput = tagsContainer.querySelector('input#product-tag-input');
      expect(tagInput?.className).toContain('focus-visible:ring-2');
      expect(tagInput?.className).toContain('focus-visible:ring-primary');

      unmountTags();
    });
  });

  describe('Issue #124: Material icon ligatures do not leak to screen readers', () => {
    it('Material icon symbols in buttons have aria-hidden="true" and buttons have descriptive aria-label', () => {
      const { container, unmount } = renderComponent(
        <ProductBasicInfo
          modalMode="create"
          title="Bonbons"
          slug="bonbons"
          price="300"
          category="Sucreries"
          setTitle={vi.fn()}
          setSlug={vi.fn()}
          setPrice={vi.fn()}
          setCategory={vi.fn()}
        />
      );

      // Button generating slug from title
      const slugBtn = container.querySelector('button[aria-label="Générer le slug à partir du titre"]');
      expect(slugBtn).not.toBeNull();
      const icon = slugBtn?.querySelector('span.material-symbols-outlined');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');

      unmount();
    });

    it('ProductTagsEditor delete tag buttons have aria-label and aria-hidden on icon', () => {
      const { container, unmount } = renderComponent(
        <ProductTagsEditor
          tags={['Bio']}
          newTagInput=""
          setNewTagInput={vi.fn()}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
          onTagKeyDown={vi.fn()}
        />
      );

      const removeBtn = container.querySelector('button[aria-label="Supprimer le tag Bio"]');
      expect(removeBtn).not.toBeNull();
      const icon = removeBtn?.querySelector('span.material-symbols-outlined');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');

      unmount();
    });
  });
});
