"use client";

import { useState } from 'react';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: Faq[];
}

export default function FaqSection({ faqs }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mx-auto max-w-container-max px-gutter pb-xl mt-lg">
      <div className="mx-auto max-w-3xl text-center mb-xl">
        <h2 className="font-display text-4xl font-bold text-on-surface">
          Questions Fréquentes (FAQ)
        </h2>
        <p className="mt-sm text-base text-on-surface-variant">
          Retrouvez les réponses aux questions les plus fréquentes sur nos produits et services.
        </p>
      </div>

      <div className="mx-auto max-w-3xl flex flex-col gap-sm">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.id}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-soft transition-all duration-300"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between gap-md p-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors hover:bg-surface-container-high"
                aria-expanded={isOpen}
              >
                <span className="font-display text-base md:text-lg font-bold text-on-surface leading-snug">
                  {faq.question}
                </span>
                <span
                  className={`material-symbols-outlined shrink-0 text-primary transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  keyboard_arrow_down
                </span>
              </button>

              {/* Accordion Content */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[500px] border-t border-outline-variant/10' : 'max-h-0'
                }`}
              >
                <div className="p-md text-sm md:text-base leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
