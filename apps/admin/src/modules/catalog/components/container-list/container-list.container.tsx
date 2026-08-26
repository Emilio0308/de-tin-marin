"use client";

import { useMemo, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { adminListPageBounds } from "@de-tin-marin/validations/admin-list";
import { Button } from "@de-tin-marin/ui/button";
import { listSurpriseContainersPageAction } from "@/modules/catalog/actions/list-surprise-containers";
import { softDeleteSurpriseContainerAction } from "@/modules/catalog/actions/soft-delete-surprise-container";
import {
  buildAdminListSearchParams,
  readAdminContainerListQuery,
} from "@/shared/helpers/admin-list-url";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { useConfirmDialog } from "@/shared/components/confirm-dialog/confirm-dialog";
import { isLowStock } from "../container-form/container-form.helpers";
import { ContainerList } from "./container-list";
import type { ContainerListLabels } from "./container-list.types";

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

export function ContainerListContainer() {
  const t = useTranslations("containers");
  const tCommon = useTranslations("common.pagination");
  const tFeedback = useTranslations("common");
  const { confirm, dialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const listQuery = useMemo(
    () => readAdminContainerListQuery(searchParams),
    [searchParams],
  );

  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );

  const containersQuery = useQuery({
    queryKey: queryKeys.catalog.surpriseContainersPage(listQuery),
    queryFn: async () => {
      const result = await listSurpriseContainersPageAction(listQuery);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteSurpriseContainerAction(id);
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: async () => {
      await invalidateAdminCatalogLists(queryClient, "surpriseContainers");
    },
  });

  function pushParams(updates: Record<string, string | undefined>) {
    const params = buildAdminListSearchParams(searchParams, updates);
    startTransition(() => {
      router.push(`/containers?${params.toString()}`, { scroll: false });
    });
  }

  async function handleDelete(id: string) {
    const accepted = await confirm({
      description: t("deleteConfirm"),
    });
    if (!accepted) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(tFeedback("confirmDialog.deleteSuccess")),
      onError: (error) => {
        if (error.message === "CONTAINER_IN_USE") {
          toast.error(t("deleteInUse"));
          return;
        }
        toast.error(tFeedback("error"));
      },
    });
  }

  const page = containersQuery.data?.page ?? listQuery.page;
  const pageSize = containersQuery.data?.pageSize ?? listQuery.pageSize;
  const total = containersQuery.data?.total ?? 0;
  const items = useMemo(
    () => containersQuery.data?.items ?? [],
    [containersQuery.data?.items],
  );
  const bounds = adminListPageBounds(page, pageSize, total, items.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilters =
    Boolean(listQuery.search) || listQuery.status !== "all";

  const totalStockUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.stockQuantity, 0),
    [items],
  );

  const lowStockCount = useMemo(
    () => items.filter((item) => isLowStock(item.stockQuantity)).length,
    [items],
  );

  const labels: ContainerListLabels = useMemo(
    () => ({
      columns: {
        sku: t("columns.sku"),
        image: t("columns.image"),
        name: t("columns.name"),
        price: t("columns.price"),
        stock: t("columns.stock"),
        status: t("columns.status"),
        actions: t("columns.actions"),
      },
      statusActive: t("statusActive"),
      statusInactive: t("statusInactive"),
      stockCritical: t("stockCritical"),
      stockOut: t("stockOut"),
      edit: t("edit"),
      delete: t("delete"),
      empty: t("empty"),
      emptyFiltered: t("emptyFiltered"),
      formatPrice: (amount) => t("formatPrice", { amount: amount.toFixed(2) }),
      formatStockUnits: (count) => t("stockUnits", { count }),
      pagination: {
        summary: t("pagination", {
          from: bounds.from,
          to: bounds.to,
          total,
        }),
        previous: tCommon("previous"),
        next: tCommon("next"),
        page: tCommon("page", { page, totalPages }),
      },
      formatAriaEdit: (name) => t("ariaEdit", { name }),
      formatAriaDelete: (name) => t("ariaDelete", { name }),
      stats: {
        totalUnits: t("stats.totalUnits"),
        lowStock: t("stats.lowStock"),
        formatLowStockValue: (count) => t("stats.lowStockValue", { count }),
      },
    }),
    [t, tCommon, bounds.from, bounds.to, total, page, totalPages],
  );

  return (
    <>
      {dialog}
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
          <Link href="/containers/new" className="hidden lg:block lg:self-end">
            <Button className="min-h-14 px-8">
              <Plus className="mr-2 h-5 w-5" aria-hidden />
              {t("newContainer")}
            </Button>
          </Link>
        </header>

        <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <form
            className="relative w-full sm:max-w-xs"
            onSubmit={(event) => {
              event.preventDefault();
              pushParams({
                search: searchDraft.trim() || undefined,
                page: "1",
              });
            }}
          >
            <Search
              className="text-on-surface-variant pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.label")}
              className="border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary font-body h-12 w-full rounded-xl border-2 pl-12 pr-4 text-sm outline-none transition-colors"
            />
          </form>
          <FilterChip
            label={t("filters.status")}
            value={listQuery.status}
            onChange={(value) =>
              pushParams({
                status: value === "all" ? undefined : value,
                page: "1",
              })
            }
            options={[
              { value: "all", label: t("filters.statusAll") },
              { value: "active", label: t("filters.statusActive") },
              { value: "inactive", label: t("filters.statusInactive") },
              { value: "outOfStock", label: t("filters.statusOutOfStock") },
            ]}
          />
        </section>

        {containersQuery.isLoading ? (
          <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
            <p className="font-body text-body-md text-on-surface-variant">
              {t("loading")}
            </p>
          </div>
        ) : containersQuery.isError ? (
          <div className="border-error/20 bg-error-container/40 rounded-4xl border p-12 text-center">
            <p className="font-body text-body-md text-on-error-container">
              {t("loadError")}
            </p>
          </div>
        ) : (
          <ContainerList
            containers={items}
            page={page}
            pageSize={pageSize}
            total={total}
            hasActiveFilters={hasActiveFilters}
            totalStockUnits={totalStockUnits}
            lowStockCount={lowStockCount}
            labels={labels}
            onDelete={(id) => {
              void handleDelete(id);
            }}
            onPageChange={(nextPage) => pushParams({ page: String(nextPage) })}
            deletingId={
              deleteMutation.isPending
                ? (deleteMutation.variables ?? null)
                : null
            }
          />
        )}

        <Link
          href="/containers/new"
          aria-label={t("newContainer")}
          className="press-down bg-primary text-on-primary fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Link>
      </div>
    </>
  );
}
