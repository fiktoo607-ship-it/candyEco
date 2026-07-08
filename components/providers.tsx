"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import TabVisibilityNotifier from './TabVisibilityNotifier';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // Monkeypatch DOM operations to prevent Google Translate from crashing React
    if (typeof window !== 'undefined') {
      const nd = Node.prototype as any;
      
      const originalRemoveChild = nd.removeChild;
      nd.removeChild = function (child: any) {
        try {
          return originalRemoveChild.call(this, child);
        } catch (error) {
          if (error instanceof Error && error.name === 'NotFoundError') {
            return child;
          }
          throw error;
        }
      };

      const originalInsertBefore = nd.insertBefore;
      nd.insertBefore = function (newNode: any, referenceNode: any) {
        try {
          return originalInsertBefore.call(this, newNode, referenceNode);
        } catch (error) {
          if (error instanceof Error && error.name === 'NotFoundError') {
            return newNode;
          }
          throw error;
        }
      };
    }

    const preventIconTranslation = (root: ParentNode = document) => {
      const icons = root.querySelectorAll('.material-symbols-outlined');
      icons.forEach((icon) => {
        if (!icon.classList.contains('notranslate')) {
          icon.classList.add('notranslate');
        }
        if (icon.getAttribute('translate') !== 'no') {
          icon.setAttribute('translate', 'no');
        }
      });
    };

    preventIconTranslation();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains('material-symbols-outlined')) {
                if (!node.classList.contains('notranslate')) {
                  node.classList.add('notranslate');
                }
                if (node.getAttribute('translate') !== 'no') {
                  node.setAttribute('translate', 'no');
                }
              }
              preventIconTranslation(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TabVisibilityNotifier />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
