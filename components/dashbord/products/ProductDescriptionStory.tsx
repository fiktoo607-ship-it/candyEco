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
        <label className="text-sm font-bold text-on-surface-variant">
          Description *
        </label>
        <textarea
          required
          rows={3}
          placeholder="Décrivez brièvement le produit..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="text-sm font-bold text-on-surface-variant">
          Histoire *
        </label>
        <textarea
          required
          rows={3}
          placeholder="Racontez l'histoire/l'héritage du produit..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>
    </>
  );
}
