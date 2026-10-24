import React from 'react';

interface ProductDescriptionStoryProps {
  description: string;
  setDescription: (v: string) => void;
  story: string;
  setStory: (v: string) => void;
}

export function ProductDescriptionStory({
  description,
  setDescription,
  story,
  setStory,
}: ProductDescriptionStoryProps) {
  return (
    <>
      <div className="flex flex-col gap-xs">
        <label htmlFor="product-description" className="text-sm font-bold text-on-surface-variant">
          Description *
        </label>
        <textarea
          id="product-description"
          required
          rows={3}
          placeholder="Décrivez brièvement le produit..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary resize-y"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="product-story" className="text-sm font-bold text-on-surface-variant">
          Histoire *
        </label>
        <textarea
          id="product-story"
          required
          rows={3}
          placeholder="Racontez l'histoire/l'héritage du produit..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary resize-y"
        />
      </div>
    </>
  );
}
