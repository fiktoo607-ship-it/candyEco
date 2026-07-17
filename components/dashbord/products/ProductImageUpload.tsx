import React from 'react';
import Image from 'next/image';

interface ProductImageUploadProps {
  imageUrl: string;
  setImageUrl: (v: string) => void;
  isUploading: boolean;
  uploadError: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductImageUpload({
  imageUrl,
  setImageUrl,
  isUploading,
  uploadError,
  onFileUpload,
}: ProductImageUploadProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-sm font-bold text-on-surface-variant">
        Image du produit *
      </label>

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-2xl p-md bg-surface-container-low/50 hover:bg-surface-container-low transition-colors relative group">
        {imageUrl ? (
          <div className="relative w-full flex flex-col items-center gap-sm">
            <div className="relative h-36 w-full max-w-xs overflow-hidden rounded-xl border border-outline-variant/30 shadow-md">
              <Image
                src={imageUrl}
                alt="Aperçu du produit"
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Voulez-vous vraiment enlever cette image ?")) {
                  setImageUrl("");
                }
              }}
              className="rounded-xl bg-error/10 px-md py-sm text-xs font-bold text-error hover:bg-error/20 transition-colors flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Supprimer l'image
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center cursor-pointer py-md w-full gap-sm">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/40">
              <span className="material-symbols-outlined text-3xl">image</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-primary hover:underline block">
                Aucune image chargée. Cliquez pour en importer une.
              </span>
              <span className="text-xs text-on-surface-variant/80 mt-[2px] block">
                PNG, JPG, WEBP jusqu'à 10 Mo
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs flex flex-col items-center justify-center gap-xs rounded-2xl">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="text-xs font-bold text-primary">
              Chargement de l'image...
            </span>
          </div>
        )}
      </div>

      {uploadError && (
        <span className="text-xs text-error font-medium flex items-center gap-xs">
          <span className="material-symbols-outlined text-xs select-none">error</span>
          {uploadError}
        </span>
      )}
    </div>
  );
}
