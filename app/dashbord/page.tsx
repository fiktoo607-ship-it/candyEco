"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null;
  state: 'exist' | 'outofStock' | 'commingSoun';
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = ['معجنات', 'كعك', 'بسكويت', 'حلويات', 'مخبوزات'];

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form States & Modal Controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [limitBay, setLimitBay] = useState('');
  const [state, setState] = useState<'exist' | 'outofStock' | 'commingSoun'>('exist');
  const [publishedAt, setPublishedAt] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch all products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while fetching products.";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Open modal for creating product
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setTitle('');
    setSlug('');
    setPrice('');
    setImageUrl('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600');
    setDescription('');
    setStory('');
    setLimitBay('');
    setState('exist');
    setPublishedAt(new Date().toISOString().substring(0, 10)); // default to today
    setCategory(CATEGORIES[0]);
    setIsModalOpen(true);
  };

  // Open modal for editing product
  const handleOpenEdit = (p: Product) => {
    setModalMode('edit');
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setPrice(p.price);
    setImageUrl(p.imageUrl);
    setDescription(p.description);
    setStory(p.story);
    setLimitBay(p.limitBay !== null ? String(p.limitBay) : '');
    setState(p.state);
    setPublishedAt(p.publishedAt ? new Date(p.publishedAt).toISOString().substring(0, 10) : '');
    setCategory(p.category);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      console.error(msg);
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Form Submission (Create or Edit)
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

    setIsSubmitting(true);
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
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error ? err.message : "An error occurred while saving.";
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (p: Product) => {
    setProductToDelete(p);
    setIsDeleteOpen(true);
  };

  // Perform delete request
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete product');
      setIsDeleteOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting.";
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      dir="ltr"
      className="flex min-h-screen flex-col bg-surface text-on-surface md:flex-row"
    >
      {/* Sidebar */}
      <aside className="sticky top-0 z-20 flex w-full flex-col border-r border-outline-variant/30 bg-surface-container-lowest shadow-soft md:min-h-screen md:w-64">
        <div className="flex items-center gap-sm p-lg">
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
            bakery_dining
          </span>
          {/* <span className="font-display text-2xl font-bold text-primary">Admin</span> */}
        </div>
        <nav className="flex flex-1 flex-col gap-sm px-md">
          <a
            className="rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            href="#overview"
          >
            Overview
          </a>
          <a
            className="rounded-lg bg-primary-container/10 px-md py-sm text-primary transition-colors font-semibold"
            href="#products"
          >
            Manage Products
          </a>
          <a
            className="rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            href="#orders"
          >
            Orders
          </a>
        </nav>
        <div className="mt-auto border-t border-outline-variant/30 p-md">
          <a
            className="rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:text-primary"
            href="#logout"
          >
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md px-gutter shadow-soft">
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Manage Products
          </h1>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-xs rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add New Product
          </button>
        </header>

        <div className="mx-auto w-full max-w-container-max flex-1 p-gutter">
          {error && (
            <div className="mb-md rounded-xl bg-error-container p-md text-on-error-container border border-error/20 flex gap-sm items-center">
              <span className="material-symbols-outlined">error</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
            {/* Search and Filters */}
            <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between">
              <label className="relative w-full lg:w-80">
                <span className="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-xl pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="text-sm text-on-surface-variant font-medium">
                Total Products:{" "}
                <span className="text-primary font-bold">{totalItems}</span>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-md">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                  sync
                </span>
                <p className="text-on-surface-variant">Loading products...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">
                  folder_open
                </span>
                <p className="text-lg font-semibold">No products found</p>
                <p className="text-sm">
                  Try adding a new product or refining your search query.
                </p>
              </div>
            ) : (
              /* Products Table */
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                      <th className="p-md">Image</th>
                      <th className="p-md">Title</th>
                      <th className="p-md">Category</th>
                      <th className="p-md">Price</th>
                      <th className="p-md">State</th>
                      <th className="p-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {currentItems.map((product) => (
                      <tr
                        key={product.id}
                        className="group transition-colors hover:bg-surface/50"
                      >
                        <td className="p-md">
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-surface-container-high border border-outline-variant/20 shadow-sm">
                            <Image
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        </td>
                        <td className="p-md">
                          <div className="font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-sm">
                            {product.title}
                          </div>
                          <div className="text-xs text-on-surface-variant/80 mt-[2px] line-clamp-1 max-w-md">
                            {product.description}
                          </div>
                        </td>
                        <td className="p-md">
                          <span className="rounded-full bg-secondary-container/20 px-sm py-xs text-sm text-on-surface font-medium border border-outline-variant/30">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-md font-bold text-primary">
                          {product.price}
                        </td>
                        <td className="p-md">
                          <span
                            className={`rounded-full px-sm py-[2px] text-xs font-semibold ${
                              product.state === "exist"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : product.state === "outofStock"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            }`}
                          >
                            {product.state === "exist"
                              ? "متوفر"
                              : product.state === "outofStock"
                                ? "غير متوفر"
                                : "قريباً"}
                          </span>
                        </td>
                        <td className="p-md text-right">
                          <div className="flex justify-end gap-sm">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-sm font-semibold text-primary transition-all hover:bg-primary-container/10 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-base">
                                edit
                              </span>
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDelete(product)}
                              className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-sm font-semibold text-error transition-all hover:bg-error-container/30 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-base">
                                delete
                              </span>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!isLoading && totalItems > 0 && (
              <div className="flex items-center justify-between border-t border-outline-variant/30 p-md">
                <span className="text-sm text-on-surface-variant font-medium">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, totalItems)} of {totalItems}{" "}
                  entries
                </span>
                <div className="flex gap-xs">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                    className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-md px-sm py-xs text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-primary text-white shadow-soft"
                            : "border border-outline-variant text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((c) => Math.min(c + 1, totalPages))
                    }
                    className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add / Edit Glassmorphism Modal */}
      {isModalOpen && (
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
                    onChange={(e) => setState(e.target.value as any)}
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
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-lg border border-outline-variant/30 animate-scale-up">
            <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm bg-surface-container-low">
              <h2 className="font-display text-xl font-bold text-error flex items-center gap-xs">
                <span className="material-symbols-outlined">warning</span>
                Confirm Delete
              </h2>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-md">
              <p className="text-on-surface-variant leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-on-surface">
                  "{productToDelete?.title}"
                </span>
                ? This action is permanent and cannot be undone.
              </p>

              <footer className="mt-md flex justify-end gap-sm pt-md border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="rounded-lg border border-outline-variant px-md py-sm font-semibold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="rounded-lg bg-error px-md py-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-xs"
                >
                  {isSubmitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      sync
                    </span>
                  )}
                  Delete
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}