// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import StorySection from '@/components/home/StorySection';
import { HomepageStorySection } from '@/components/dashbord/cms/HomepageStorySection';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Story Section & CMS Image Update', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
    }
    if (container) {
      container.remove();
    }
    container = null;
    root = null;
  });

  describe('StorySection Component', () => {
    it('renders with default image when no imageUrl is provided', () => {
      act(() => {
        root!.render(
          <StorySection title="Notre Engagement" description="Qualité artisanale." />
        );
      });

      const img = container?.querySelector('img') as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toContain('lh3.googleusercontent.com');
      expect(container?.textContent).toContain('Notre Engagement');
      expect(container?.textContent).toContain('Qualité artisanale.');
    });

    it('renders custom image when imageUrl is passed', () => {
      const customUrl = 'https://res.cloudinary.com/test/image.webp';
      act(() => {
        root!.render(
          <StorySection 
            title="Notre Engagement" 
            description="Qualité artisanale." 
            imageUrl={customUrl} 
          />
        );
      });

      const img = container?.querySelector('img') as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toBe(customUrl);
    });
  });

  describe('HomepageStorySection CMS Component', () => {
    it('renders the preview, upload button and hidden form input', () => {
      const mockRegister = vi.fn((name: string) => ({ name }));
      const mockWatch = vi.fn((name: string) => {
        if (name === 'homepage_story_image') return 'https://res.cloudinary.com/test/custom.webp';
        return '';
      });
      const mockHandleUpload = vi.fn();

      act(() => {
        root!.render(
          <HomepageStorySection
            register={mockRegister}
            watch={mockWatch}
            handleStoryImageUpload={mockHandleUpload}
          />
        );
      });

      const img = container?.querySelector('img') as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toBe('https://res.cloudinary.com/test/custom.webp');

      const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDefined();
      expect(fileInput.accept).toBe('image/*');

      // Verify register was called for homepage_story_image, title and description
      expect(mockRegister).toHaveBeenCalledWith('homepage_story_image');
      expect(mockRegister).toHaveBeenCalledWith('homepage_story_title', expect.any(Object));
      expect(mockRegister).toHaveBeenCalledWith('homepage_story_description', expect.any(Object));
    });
  });
});
