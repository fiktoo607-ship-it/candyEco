"use client";

import { useId, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

export default function SearchBar({ value, onChange, placeholder = "Rechercher un produit...", onFocus }: SearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus preservation: if the input loses focus during layout shifts (e.g. unmounting carousel), refocus it.
  useEffect(() => {
    if (value && inputRef.current && document.activeElement !== inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <div className="relative flex items-center">
        {/* Search Icon */}
        {/* <span className="material-symbols-outlined absolute left-4 text-outline text-2xl pointer-events-none select-none">
          search
        </span> */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
          className="w-full h-12 pl-12 pr-12 rounded-full border border-outline-variant bg-surface-container-low text-base text-on-surface placeholder-outline outline-none transition-all focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
        />
        {/* Reset (Clear) Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-4 flex items-center justify-center p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors"
            aria-label="Effacer la recherche"
          >
            <span className="material-symbols-outlined text-lg select-none">
              close
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
