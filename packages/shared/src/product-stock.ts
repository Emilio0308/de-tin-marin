export function computeTotalBaseUnits(
  sealedPackages: number,
  looseBaseUnits: number,
  itemsPerPackage: number,
): number {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  return sealedPackages * safeItems + looseBaseUnits;
}

export function normalizeProductStock(
  sealedPackages: number,
  looseBaseUnits: number,
  itemsPerPackage: number,
): { sealedPackages: number; looseBaseUnits: number } {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  if (looseBaseUnits < safeItems) {
    return { sealedPackages, looseBaseUnits };
  }

  const extraSealed = Math.floor(looseBaseUnits / safeItems);
  return {
    sealedPackages: sealedPackages + extraSealed,
    looseBaseUnits: looseBaseUnits % safeItems,
  };
}

export type DeductBaseUnitsResult =
  { sealedPackages: number; looseBaseUnits: number } | "INSUFFICIENT_STOCK";

export function deductBaseUnits(
  sealedPackages: number,
  looseBaseUnits: number,
  itemsPerPackage: number,
  need: number,
): DeductBaseUnitsResult {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));

  if (need <= 0) {
    return normalizeProductStock(sealedPackages, looseBaseUnits, safeItems);
  }

  let remaining = need;
  let nextLoose = looseBaseUnits;
  let nextSealed = sealedPackages;

  const fromLoose = Math.min(remaining, nextLoose);
  remaining -= fromLoose;
  nextLoose -= fromLoose;

  while (remaining > 0) {
    if (nextSealed <= 0) {
      return "INSUFFICIENT_STOCK";
    }

    nextSealed -= 1;
    const take = Math.min(remaining, safeItems);
    remaining -= take;
    nextLoose += safeItems - take;
  }

  return normalizeProductStock(nextSealed, nextLoose, safeItems);
}

export function formatStockDisplay(input: {
  sealedPackages: number;
  looseBaseUnits: number;
  itemsPerPackage: number;
  packageLabel?: string | null;
}): string {
  const { sealedPackages, looseBaseUnits, itemsPerPackage, packageLabel } =
    input;
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  const packageWord = packageLabel?.trim() || "paquete";
  const packagePlural = sealedPackages === 1 ? packageWord : `${packageWord}s`;

  if (safeItems === 1) {
    return `${looseBaseUnits + sealedPackages} u.`;
  }

  const parts: string[] = [];
  if (sealedPackages > 0) {
    parts.push(`${sealedPackages} ${packagePlural}`);
  }
  if (looseBaseUnits > 0) {
    parts.push(`${looseBaseUnits} u.`);
  }
  if (parts.length === 0) {
    return "0 u.";
  }
  return parts.join(" + ");
}
