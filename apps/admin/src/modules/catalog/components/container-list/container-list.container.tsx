"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { Button } from "@de-tin-marin/ui/button";
import { listSurpriseContainersAction } from "@/modules/catalog/actions/list-surprise-containers";
import { softDeleteSurpriseContainerAction } from "@/modules/catalog/actions/soft-delete-surprise-container";
import { isLowStock } from "../container-form/container-form.helpers";
import { ContainerList } from "./container-list";
import type { ContainerListLabels } from "./container-list.types";

type StatusFilter = "all" | "active" | "inactive" | "outOfStock";

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const query = useQuery({
    queryKey: ["surprise-containers"],
    queryFn: async () => {
      const result = await listSurpriseContainersAction();
      if (!result.ok) throw new Error(result.error);
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
      await queryClient.invalidateQueries({
        queryKey: ["surprise-containers"],
      });
    },
  });

  const containers = useMemo(() => query.data ?? [], [query.data]);

  const filteredContainers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return containers.filter((container) => {
      const matchesSearch =
        term === "" ||
        container.name.toLowerCase().includes(term) ||
        container.sku.toLowerCase().includes(term);
      const matchesStatus =
        status === "all" ||
        (status === "active" && container.isActive) ||
        (status === "inactive" && !container.isActive) ||
        (status === "outOfStock" && container.stockQuantity <= 0);
      return matchesSearch && matchesStatus;
    });
  }, [containers, search, status]);

  const totalStockUnits = useMemo(
    () => containers.reduce((sum, item) => sum + item.stockQuantity, 0),
    [containers],
  );

  const lowStockCount = useMemo(
    () => containers.filter((item) => isLowStock(item.stockQuantity)).length,
    [containers],
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
      formatPagination: (shown, total) => t("pagination", { shown, total }),
      formatAriaEdit: (name) => t("ariaEdit", { name }),
      formatAriaDelete: (name) => t("ariaDelete", { name }),
      stats: {
        totalUnits: t("stats.totalUnits"),
        lowStock: t("stats.lowStock"),
        formatLowStockValue: (count) => t("stats.lowStockValue", { count }),
      },
    }),
    [t],
  );

  function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    deleteMutation.mutate(id, {
      onError: (error) => {
        if (error.message === "CONTAINER_IN_USE") {
          window.alert(t("deleteInUse"));
        }
      },
    });
  }

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
        <Link href="/containers/new" className="hidden lg:block lg:self-end">
          <Button className="min-h-14 px-8">
            <Plus className="mr-2 h-5 w-5" aria-hidden />
            {t("newContainer")}
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
        <FilterChip
          label={t("filters.status")}
          value={status}
          onChange={(value) => setStatus(value as StatusFilter)}
          options={[
            { value: "all", label: t("filters.statusAll") },
            { value: "active", label: t("filters.statusActive") },
            { value: "inactive", label: t("filters.statusInactive") },
            { value: "outOfStock", label: t("filters.statusOutOfStock") },
          ]}
        />
      </section>

      {query.isLoading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loading")}
          </p>
        </div>
      ) : query.isError ? (
        <div className="border-error/20 bg-error-container/40 rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-error-container">
            {t("loadError")}
          </p>
        </div>
      ) : (
        <ContainerList
          containers={filteredContainers}
          totalCount={containers.length}
          totalStockUnits={totalStockUnits}
          lowStockCount={lowStockCount}
          labels={labels}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
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
  );
}
