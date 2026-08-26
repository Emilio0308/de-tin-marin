import type { HeroImageDTO } from "@/modules/web-customization/types/hero.dto";
import type { HeroImageDraft } from "./web-customization-page.types";

/** Convert ISO timestamptz → value for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert datetime-local value → ISO string with offset (Zod datetime). */
export function fromDatetimeLocalValue(local: string): string {
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATETIME");
  }
  return date.toISOString();
}

export function defaultDateRange(): { startsAt: string; endsAt: string } {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

export function toImageDraft(image: HeroImageDTO): HeroImageDraft {
  return {
    id: image.id,
    imageUrl: image.imageUrl,
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
    startsAtLocal: toDatetimeLocalValue(image.startsAt),
    endsAtLocal: toDatetimeLocalValue(image.endsAt),
    pendingFile: null,
    previewUrl: image.imageUrl,
  };
}

export function emptyImageDraft(sortOrder: number): HeroImageDraft {
  const range = defaultDateRange();
  return {
    id: null,
    imageUrl: "",
    altText: "",
    sortOrder,
    startsAtLocal: toDatetimeLocalValue(range.startsAt),
    endsAtLocal: toDatetimeLocalValue(range.endsAt),
    pendingFile: null,
    previewUrl: null,
  };
}

/** True when the draft can persist an image_url (file pending or CDN URL). */
export function draftHasPersistableImage(draft: HeroImageDraft): boolean {
  if (draft.pendingFile) return true;
  const url = draft.imageUrl.trim();
  return url.length > 0 && !url.startsWith("blob:");
}

export function moveImageOrder(
  images: HeroImageDTO[],
  id: string,
  direction: "up" | "down",
): string[] | null {
  const index = images.findIndex((img) => img.id === id);
  if (index < 0) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= images.length) return null;
  const next = [...images];
  const current = next[index];
  const swap = next[target];
  if (!current || !swap) return null;
  next[index] = swap;
  next[target] = current;
  return next.map((img) => img.id);
}
