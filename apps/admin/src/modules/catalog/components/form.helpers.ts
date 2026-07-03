export function formField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formNumber(formData: FormData, key: string): number {
  const value = formField(formData, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
