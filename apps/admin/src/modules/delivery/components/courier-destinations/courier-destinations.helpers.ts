import { listCourierCatalogDepartmentsNotInDb } from "@de-tin-marin/shared/courier-provinces-catalog";
import type { CourierDepartmentDTO } from "@/modules/delivery/types/delivery.dto";

export function listAvailableCourierCatalogDepartments(
  departments: CourierDepartmentDTO[],
) {
  return listCourierCatalogDepartmentsNotInDb(
    departments.map((department) => department.name),
  );
}
