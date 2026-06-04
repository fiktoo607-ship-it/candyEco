import Image from 'next/image';
import { convertToWebP } from '@/lib/image-utils';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useCreateProduct, useUpdateProduct, useUploadImage } from '@/lib/hooks/use-products';

const CATEGORIES = ['معجنات', 'كعك', 'بسكويت', 'حلويات', 'مخبوزات'];

export default function ProductModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    editingId,
    title,
    setTitle,
    slug,
    setSlug,
    price,
    setPrice,
    imageUrl,
    setImageUrl,
    uploadError,
    setUploadError,
    description,
    setDescription,
    story,
    setStory,
    limitBay,
    setLimitBay,
    state,
    setState,
    publishedAt,
    setPublishedAt,
    category,
    setCategory,
  } = useDashboardStore();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUploadImage();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  if (!isModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    try {
      // Convert image to WebP format before uploading using image utility helper
      const webpBlob = await convertToWebP(file);
      
      const originalName = file.name;
      const dotIndex = originalName.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const webpFileName = `${baseName}.webp`;

      const webpFile = new File([webpBlob], webpFileName, { type: "image/webp" });

      if (webpFile.size > 10 * 1024 * 1024) {
        setUploadError("Image size must be less than 10MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", webpFile);

      const data = await uploadMutation.mutateAsync(formData);
      setImageUrl(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      console.error(msg);
      setUploadError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      alert("Please wait for the image upload to complete.");
      return;
    }
    if (!title || !slug || !price || !imageUrl || !description || !story) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      title,
      slug,
      price,
      imageUrl,
      description,
      story,
      category,
      limitBay: limitBay.trim() === '' ? null : Number(limitBay),
      state,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    };

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        if (!editingId) return;
        await updateMutation.mutateAsync({ id: editingId, payload });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error ? err.message : "An error occurred while saving.";
      alert(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
        <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
          <h2 className="font-display text-xl font-bold text-on-surface">
            {modalMode === "create" ? "Add New Product" : "Edit Product"}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-md flex flex-col gap-sm overflow-y-auto max-h-[75vh]"
        >
          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. كعكة الكاكاو"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (modalMode === "create") {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-ء-ي]/g, ""),
                    );
                  }
                }}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Slug *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. cocoa-cake"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Price *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. $45.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-sm font-bold text-on-surface-variant">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="text-sm font-bold text-on-surface-variant">
              Product Image *
            </label>

            {/* File Upload Zone */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-md bg-surface-container-low/50 hover:bg-surface-container-low transition-colors relative group">
              {imageUrl ? (
                <div className="relative w-full flex flex-col items-center gap-sm">
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-outline-variant/30 shadow-md">
                    <Image
                      src={imageUrl}
                      alt="Product preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="rounded-full bg-error/10 px-sm py-xs text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-sm w-full">
                  <span className="material-symbols-outlined text-4xl text-primary mb-xs">
                    cloud_upload
                  </span>
                  <span className="text-sm font-semibold text-on-surface">
                    Click to upload image
                  </span>
                  <span className="text-xs text-on-surface-variant/80 mt-[2px]">
                    PNG, JPG, WEBP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs flex flex-col items-center justify-center gap-xs rounded-xl">
                  <span className="material-symbols-outlined text-2xl text-primary animate-spin">
                    sync
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    Uploading image...
                  </span>
                </div>
              )}
            </div>

            {uploadError && (
              <span className="text-xs text-error font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">
                  error
                </span>
                {uploadError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-sm">
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                Limit Purchase
              </label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={limitBay}
                onChange={(e) => setLimitBay(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as 'exist' | 'outofStock' | 'commingSoun')}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              >
                <option value="exist">Exist</option>
                <option value="outofStock">Out of Stock</option>
                <option value="commingSoun">Coming Soon</option>
              </select>
            </div>
            <div className="flex flex-col gap-xs col-span-1">
              <label className="text-sm font-bold text-on-surface-variant">
                Publish Date
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary h-[38px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">
              Description *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Describe the product shortly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-bold text-on-surface-variant">
              Story *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Tell the story/heritage of the product..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary resize-none"
            />
          </div>

          <footer className="mt-md flex justify-end gap-sm border-t border-outline-variant/20 pt-md">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="rounded-lg bg-primary px-md py-sm font-semibold text-white hover:bg-surface-tint disabled:opacity-60 flex items-center gap-xs"
            >
              {(isSubmitting || isUploading) && (
                <span className="material-symbols-outlined text-sm animate-spin">
                  sync
                </span>
              )}
              {modalMode === "create" ? "Create" : "Save Changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
