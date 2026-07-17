// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useLockBodyScroll } from '@/lib/hooks/use-lock-body-scroll';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function TestComponent({ open }: { open: boolean }) {
  useLockBodyScroll(open);
  return <div>Test Modal</div>;
}

describe('useLockBodyScroll', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    // Reset body style
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Create container
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
    }
    vi.restoreAllMocks();
  });

  it('should lock body scroll when open is true', async () => {
    expect(document.body.style.overflow).toBe('');

    await act(async () => {
      root!.render(<TestComponent open={true} />);
    });

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should not lock body scroll when open is false', async () => {
    await act(async () => {
      root!.render(<TestComponent open={false} />);
    });

    expect(document.body.style.overflow).toBe('');
  });

  it('should restore body scroll when modal is closed', async () => {
    await act(async () => {
      root!.render(<TestComponent open={true} />);
    });
    expect(document.body.style.overflow).toBe('hidden');

    await act(async () => {
      root!.render(<TestComponent open={false} />);
    });
    expect(document.body.style.overflow).toBe('');
  });

  it('should restore body scroll when component is unmounted', async () => {
    await act(async () => {
      root!.render(<TestComponent open={true} />);
    });
    expect(document.body.style.overflow).toBe('hidden');

    await act(async () => {
      root!.unmount();
      root = null;
    });
    expect(document.body.style.overflow).toBe('');
  });

  it('should apply padding-right to prevent layout shift if scrollbar exists', async () => {
    // Mock window.innerWidth and document.documentElement.clientWidth to simulate a 17px scrollbar
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1007);

    await act(async () => {
      root!.render(<TestComponent open={true} />);
    });

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('17px');

    await act(async () => {
      root!.unmount();
      root = null;
    });

    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('should handle nested/multiple modals correctly', async () => {
    // Mock window.innerWidth and document.documentElement.clientWidth to simulate a 17px scrollbar
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1007);

    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    const root2 = createRoot(container2);

    // Open first modal
    await act(async () => {
      root!.render(<TestComponent open={true} />);
    });

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('17px');

    // Open second modal
    await act(async () => {
      root2.render(<TestComponent open={true} />);
    });

    // Overflow and padding should still be locked
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('17px');

    // Unmount second modal
    await act(async () => {
      root2.unmount();
      document.body.removeChild(container2);
    });

    // Overflow and padding should still be locked since first modal is still open
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBe('17px');

    // Unmount first modal
    await act(async () => {
      root!.unmount();
      root = null;
    });

    // Everything should be fully restored
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });
});
