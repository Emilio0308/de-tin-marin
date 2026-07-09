"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { Button } from "@de-tin-marin/ui/button";
import type { ProductListItem } from "@de-tin-marin/validations/product";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import { softDeleteProductAction } from "@/modules/catalog/actions/soft-delete-product";
import { updateProductAction } from "@/modules/catalog/actions/update-product";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { ProductList } from "./product-list";
import type { ProductListLabels } from "./product-list.types";

type StatusFilter = "all" | "active" | "inactive";

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="border-outline-variant/30 bg-surface-container-lowest flex items-center gap-2 rounded-xl border-2 px-4 py-2.5">
      <span className="font-label text-on-surface-variant text-[11px] uppercase tracking-wide">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-label text-label-bold text-primary cursor-pointer bg-transparent outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProductListContainer() {
  const t = useTranslations("products");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteProductAction(id);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
    },
    onSuccess: async () => {
      await invalidateAdminCatalogLists(queryClient, "products");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (product: ProductListItem) => {
      const result = await updateProductAction({
        id: product.id,
        isActive: !product.isActive,
      });
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
    },
    onSuccess: async () => {
      await invalidateAdminCatalogLists(queryClient, "products");
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    deleteMutation.mutate(id);
  }

  function handleToggleActive(product: ProductListItem) {
    toggleMutation.mutate(product);
  }

  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.categoryName))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        term === "" ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);
      const matchesCategory =
        category === "all" || product.categoryName === category;
      const matchesStatus =
        status === "all" ||
        (status === "active" ? product.isActive : !product.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  const labels: ProductListLabels = useMemo(
    () => ({
      columns: {
        sku: t("columns.sku"),
        image: t("columns.image"),
        name: t("columns.name"),
        category: t("columns.category"),
        price: t("columns.price"),
        stock: t("columns.stock"),
        status: t("columns.status"),
        actions: t("columns.actions"),
      },
      statusActive: t("statusActive"),
      statusInactive: t("statusInactive"),
      stockOut: t("stockOut"),
      edit: t("edit"),
      empty: t("empty"),
      emptyFiltered: t("emptyFiltered"),
      ariaActivate: t("ariaActivate"),
      ariaDeactivate: t("ariaDeactivate"),
      formatStockAvailable: (count) => t("stockAvailable", { count }),
      formatStockLow: (count) => t("stockLow", { count }),
      formatPagination: (shown, total) => t("pagination", { shown, total }),
      formatAriaEdit: (name) => t("ariaEdit", { name }),
      formatAriaDelete: (name) => t("ariaDelete", { name }),
    }),
    [t],
  );

  return (
    <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md relative flex flex-1 flex-col pb-28 lg:p-8 lg:pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
            {t("title")}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
            {t("subtitle")}
          </p>
        </div>
        <Link href="/products/new" className="hidden lg:block lg:self-end">
          <Button className="min-h-14 px-8">
            <Plus className="mr-2 h-5 w-5" aria-hidden />
            {t("newProduct")}
          </Button>
        </Link>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="text-on-surface-variant pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            className="border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary font-body h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterChip
            label={t("filters.category")}
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: t("filters.categoryAll") },
              ...categories.map((name) => ({ value: name, label: name })),
            ]}
          />
          <FilterChip
            label={t("filters.status")}
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={[
              { value: "all", label: t("filters.statusAll") },
              { value: "active", label: t("filters.statusActive") },
              { value: "inactive", label: t("filters.statusInactive") },
            ]}
          />
        </div>
      </section>

      {productsQuery.isLoading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loading")}
          </p>
        </div>
      ) : productsQuery.isError ? (
        <div className="border-error/20 bg-error-container/40 rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-error-container">
            {t("loadError")}
          </p>
        </div>
      ) : (
        <ProductList
          products={filteredProducts}
          totalCount={products.length}
          labels={labels}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
          }
          onToggleActive={handleToggleActive}
          togglingId={
            toggleMutation.isPending
              ? (toggleMutation.variables?.id ?? null)
              : null
          }
        />
      )}

      <Link
        href="/products/new"
        aria-label={t("newProduct")}
        className="press-down bg-primary text-on-primary fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}
