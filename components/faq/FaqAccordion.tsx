"use client";

import React, { useState } from 'react';
import FaqSection from '@/components/home/FaqSection';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  items?: FaqItem[];
  faqs?: FaqItem[];
  className?: string;
}

export default function FaqAccordion({ items, faqs, className = "" }: FaqAccordionProps) {
  const data = items || faqs || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`flex flex-col gap-sm ${className}`}>
      {data.map((faq, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${faq.id}`;
        const headerId = `faq-header-${faq.id}`;

        return (
          <div
            key={faq.id}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-soft transition-all duration-300"
          >
            {/* Accordion Header */}
            <button
              id={headerId}
              type="button"
              onClick={() => toggleAccordion(index)}
              className="w-full flex items-center justify-between gap-md p-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors hover:bg-surface-container-high"
              aria-expanded={isOpen}
              aria-controls={answerId}
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
              id={answerId}
              role="region"
              aria-labelledby={headerId}
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[500px] border-t border-outline-variant/10' : 'max-h-0 hidden'
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
  );
}

export { FaqAccordion, FaqSection };
