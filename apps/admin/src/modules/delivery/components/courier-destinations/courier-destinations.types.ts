import type { CourierDepartmentCatalogEntry } from "@de-tin-marin/shared/courier-provinces-catalog";
import type { CourierDepartmentDTO } from "@/modules/delivery/types/delivery.dto";

export type CourierDestinationsLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionDepartments: string;
  sectionAddDepartment: string;
  addDepartment: string;
  addingDepartment: string;
  selectDepartment: string;
  selectDepartmentPlaceholder: string;
  noDepartmentsToAdd: string;
  departmentActive: string;
  departmentInactive: string;
  provinceEnabled: string;
  saveDepartment: string;
  savingDepartment: string;
  departmentSaved: string;
  emptyDepartments: string;
  piuraNote: string;
  errors: {
    validation: string;
    duplicateDepartment: string;
    notInCatalog: string;
    default: string;
  };
};

export type CourierDestinationsProps = {
  departments: CourierDepartmentDTO[];
  availableCatalogDepartments: readonly CourierDepartmentCatalogEntry[];
  selectedCatalogDepartment: string;
  labels: CourierDestinationsLabels;
  loading: boolean;
  loadError: string | null;
  savingDepartmentId: string | null;
  addingDepartment: boolean;
  departmentError: string | null;
  onSelectedCatalogDepartmentChange: (name: string) => void;
  onAddDepartment: () => void;
  onToggleDepartment: (department: CourierDepartmentDTO) => void;
  onToggleProvince: (
    department: CourierDepartmentDTO,
    provinceSlug: string,
  ) => void;
  onSaveDepartment: (department: CourierDepartmentDTO) => void;
};
