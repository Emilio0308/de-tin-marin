export type CourierProvinceSource = {
  slug: string;
  name: string;
  enabled: boolean;
};

export type CourierDepartmentSource = {
  id: string;
  name: string;
  isActive: boolean;
  provinces: CourierProvinceSource[];
};

export type CourierCoverageResult = {
  covered: boolean;
  fee: 0;
  departmentName?: string;
  provinceName?: string;
};

export function normalizeProvinceSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveCourierCoverage(
  departmentId: string | undefined,
  provinceSlug: string | undefined,
  departments: CourierDepartmentSource[],
  courierEnabled: boolean,
): CourierCoverageResult {
  if (!courierEnabled) {
    return { covered: false, fee: 0 };
  }

  if (!departmentId || !provinceSlug?.trim()) {
    return { covered: false, fee: 0 };
  }

  const department = departments.find(
    (entry) => entry.isActive && entry.id === departmentId,
  );
  if (!department) {
    return { covered: false, fee: 0 };
  }

  const normalizedSlug = normalizeProvinceSlug(provinceSlug);
  const province = department.provinces.find(
    (entry) =>
      entry.enabled && normalizeProvinceSlug(entry.slug) === normalizedSlug,
  );
  if (!province) {
    return { covered: false, fee: 0 };
  }

  return {
    covered: true,
    fee: 0,
    departmentName: department.name,
    provinceName: province.name,
  };
}

export function listEnabledCheckoutCourierDepartments(
  departments: CourierDepartmentSource[],
): Array<{
  id: string;
  name: string;
  provinces: Array<{ slug: string; name: string }>;
}> {
  return departments
    .filter((department) => department.isActive)
    .map((department) => ({
      id: department.id,
      name: department.name,
      provinces: department.provinces
        .filter((province) => province.enabled)
        .map((province) => ({
          slug: province.slug,
          name: province.name,
        })),
    }))
    .filter((department) => department.provinces.length > 0)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
