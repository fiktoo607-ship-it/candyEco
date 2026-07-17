import React from 'react';

interface ProductTagsEditorProps {
  tags: string[];
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ProductTagsEditor({
  tags,
  newTagInput,
  setNewTagInput,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
}: ProductTagsEditorProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-bold text-on-surface-variant">
        Mots-clés (Tags)
      </label>
      <div className="flex flex-col min-[415px]:flex-row gap-xs">
        <input
          type="text"
          placeholder="Ex: لوز, شوكولا, زيت..."
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={onAddTag}
          className="rounded-xl bg-secondary-container px-md py-sm text-sm font-bold text-on-secondary-container hover:bg-outline-variant/30 transition-all flex items-center justify-center"
        >
          Ajouter
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-xs mt-xs border border-outline-variant/30 rounded-2xl p-sm bg-surface-container-low/40">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-xs rounded-full bg-primary/10 border border-primary/20 px-sm py-1 text-xs font-bold text-primary transition-all animate-scale-up"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="rounded-full p-[2px] text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center"
                title="Supprimer"
              >
                <span className="material-symbols-outlined text-xs select-none">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
