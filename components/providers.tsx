"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

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
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
