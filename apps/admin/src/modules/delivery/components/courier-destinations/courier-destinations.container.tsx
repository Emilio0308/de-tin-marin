"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createCourierDepartmentAction,
  listCourierDepartmentsAction,
  updateCourierDepartmentAction,
} from "@/modules/delivery/actions/courier.actions";
import type { CourierDepartmentDTO } from "@/modules/delivery/types/delivery.dto";
import { listAvailableCourierCatalogDepartments } from "./courier-destinations.helpers";
import { CourierDestinations } from "./courier-destinations";
import type { CourierDestinationsLabels } from "./courier-destinations.types";

const COURIER_DEPARTMENTS_QUERY_KEY = ["courier-departments"] as const;

function departmentErrorMessage(
  error: string,
  t: ReturnType<typeof useTranslations<"delivery.courier.errors">>,
): string {
  if (error === "VALIDATION") return t("validation");
  if (error === "DUPLICATE") return t("duplicateDepartment");
  if (error === "NOT_IN_CATALOG") return t("notInCatalog");
  return t("default");
}

export function CourierDestinationsContainer() {
  const t = useTranslations("delivery.courier");
  const tErrors = useTranslations("delivery.courier.errors");
  const queryClient = useQueryClient();
  const [draftDepartments, setDraftDepartments] = useState<
    CourierDepartmentDTO[] | null
  >(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [selectedCatalogDepartment, setSelectedCatalogDepartment] =
    useState("");

  const departmentsQuery = useQuery({
    queryKey: COURIER_DEPARTMENTS_QUERY_KEY,
    queryFn: async () => {
      const result = await listCourierDepartmentsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });

  const serverDepartments = useMemo(
    () => departmentsQuery.data ?? [],
    [departmentsQuery.data],
  );
  const departments = draftDepartments ?? serverDepartments;

  const availableCatalogDepartments = useMemo(
    () => listAvailableCourierCatalogDepartments(serverDepartments),
    [serverDepartments],
  );

  const saveMutation = useMutation({
    mutationFn: async (department: CourierDepartmentDTO) => {
      const result = await updateCourierDepartmentAction({
        id: department.id,
        isActive: department.isActive,
        provinces: department.provinces,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (savedDepartment) => {
      setDepartmentError(null);
      queryClient.setQueryData<CourierDepartmentDTO[]>(
        COURIER_DEPARTMENTS_QUERY_KEY,
        (current) =>
          (current ?? []).map((entry) =>
            entry.id === savedDepartment.id ? savedDepartment : entry,
          ),
      );
      setDraftDepartments(null);
      toast.success(t("departmentSaved"));
    },
    onError: (error: Error) => {
      setDepartmentError(departmentErrorMessage(error.message, tErrors));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await createCourierDepartmentAction({ name });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (createdDepartment) => {
      setDepartmentError(null);
      setSelectedCatalogDepartment("");
      queryClient.setQueryData<CourierDepartmentDTO[]>(
        COURIER_DEPARTMENTS_QUERY_KEY,
        (current) => [...(current ?? []), createdDepartment],
      );
      toast.success(t("departmentAdded"));
    },
    onError: (error: Error) => {
      setDepartmentError(departmentErrorMessage(error.message, tErrors));
    },
  });

  const labels = useMemo<CourierDestinationsLabels>(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionDepartments: t("sectionDepartments"),
      sectionAddDepartment: t("sectionAddDepartment"),
      addDepartment: t("addDepartment"),
      addingDepartment: t("addingDepartment"),
      selectDepartment: t("selectDepartment"),
      selectDepartmentPlaceholder: t("selectDepartmentPlaceholder"),
      noDepartmentsToAdd: t("noDepartmentsToAdd"),
      departmentActive: t("departmentActive"),
      departmentInactive: t("departmentInactive"),
      provinceEnabled: t("provinceEnabled"),
      saveDepartment: t("saveDepartment"),
      savingDepartment: t("savingDepartment"),
      departmentSaved: t("departmentSaved"),
      emptyDepartments: t("emptyDepartments"),
      piuraNote: t("piuraNote"),
      errors: {
        validation: tErrors("validation"),
        duplicateDepartment: tErrors("duplicateDepartment"),
        notInCatalog: tErrors("notInCatalog"),
        default: tErrors("default"),
      },
    }),
    [t, tErrors],
  );

  function updateDraft(
    updater: (current: CourierDepartmentDTO[]) => CourierDepartmentDTO[],
  ) {
    setDraftDepartments(updater(departments));
  }

  function handleToggleDepartment(department: CourierDepartmentDTO) {
    updateDraft((current) =>
      current.map((entry) =>
        entry.id === department.id
          ? { ...entry, isActive: !entry.isActive }
          : entry,
      ),
    );
  }

  function handleToggleProvince(
    department: CourierDepartmentDTO,
    provinceSlug: string,
  ) {
    updateDraft((current) =>
      current.map((entry) => {
        if (entry.id !== department.id) return entry;
        return {
          ...entry,
          provinces: entry.provinces.map((province) =>
            province.slug === provinceSlug
              ? { ...province, enabled: !province.enabled }
              : province,
          ),
        };
      }),
    );
  }

  function handleSaveDepartment(department: CourierDepartmentDTO) {
    saveMutation.mutate(department);
  }

  function handleAddDepartment() {
    if (!selectedCatalogDepartment) return;
    setDepartmentError(null);
    createMutation.mutate(selectedCatalogDepartment);
  }

  const isInitialLoading =
    departmentsQuery.isLoading && departmentsQuery.data === undefined;

  if (isInitialLoading) {
    return (
      <CourierDestinations
        departments={[]}
        availableCatalogDepartments={[]}
        selectedCatalogDepartment=""
        labels={labels}
        loading
        loadError={null}
        savingDepartmentId={null}
        addingDepartment={false}
        departmentError={null}
        onSelectedCatalogDepartmentChange={setSelectedCatalogDepartment}
        onAddDepartment={handleAddDepartment}
        onToggleDepartment={handleToggleDepartment}
        onToggleProvince={handleToggleProvince}
        onSaveDepartment={handleSaveDepartment}
      />
    );
  }

  if (departmentsQuery.isError) {
    return (
      <CourierDestinations
        departments={[]}
        availableCatalogDepartments={[]}
        selectedCatalogDepartment=""
        labels={labels}
        loading={false}
        loadError={t("loadError")}
        savingDepartmentId={null}
        addingDepartment={false}
        departmentError={null}
        onSelectedCatalogDepartmentChange={setSelectedCatalogDepartment}
        onAddDepartment={handleAddDepartment}
        onToggleDepartment={handleToggleDepartment}
        onToggleProvince={handleToggleProvince}
        onSaveDepartment={handleSaveDepartment}
      />
    );
  }

  return (
    <CourierDestinations
      departments={departments}
      availableCatalogDepartments={availableCatalogDepartments}
      selectedCatalogDepartment={selectedCatalogDepartment}
      labels={labels}
      loading={false}
      loadError={null}
      savingDepartmentId={
        saveMutation.isPending ? (saveMutation.variables?.id ?? null) : null
      }
      addingDepartment={createMutation.isPending}
      departmentError={departmentError}
      onSelectedCatalogDepartmentChange={setSelectedCatalogDepartment}
      onAddDepartment={handleAddDepartment}
      onToggleDepartment={handleToggleDepartment}
      onToggleProvince={handleToggleProvince}
      onSaveDepartment={handleSaveDepartment}
    />
  );
}
