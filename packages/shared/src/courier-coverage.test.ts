import { describe, expect, it } from "vitest";
import {
  listEnabledCheckoutCourierDepartments,
  resolveCourierCoverage,
} from "./courier-coverage";

const departments = [
  {
    id: "dept-piura",
    name: "Piura",
    isActive: true,
    provinces: [
      { slug: "sullana", name: "Sullana", enabled: true },
      { slug: "talara", name: "Talara", enabled: false },
    ],
  },
  {
    id: "dept-lima",
    name: "Lima",
    isActive: false,
    provinces: [{ slug: "lima", name: "Lima", enabled: true }],
  },
];

describe("resolveCourierCoverage", () => {
  it("returns covered with zero fee for enabled destination", () => {
    expect(
      resolveCourierCoverage("dept-piura", "sullana", departments, true),
    ).toEqual({
      covered: true,
      fee: 0,
      departmentName: "Piura",
      provinceName: "Sullana",
    });
  });

  it("rejects disabled province", () => {
    expect(
      resolveCourierCoverage("dept-piura", "talara", departments, true),
    ).toEqual({ covered: false, fee: 0 });
  });

  it("rejects inactive department", () => {
    expect(
      resolveCourierCoverage("dept-lima", "lima", departments, true),
    ).toEqual({ covered: false, fee: 0 });
  });

  it("rejects when courier kill switch is off", () => {
    expect(
      resolveCourierCoverage("dept-piura", "sullana", departments, false),
    ).toEqual({ covered: false, fee: 0 });
  });
});

describe("listEnabledCheckoutCourierDepartments", () => {
  it("returns only active departments with enabled provinces", () => {
    expect(listEnabledCheckoutCourierDepartments(departments)).toEqual([
      {
        id: "dept-piura",
        name: "Piura",
        provinces: [{ slug: "sullana", name: "Sullana" }],
      },
    ]);
  });
});
