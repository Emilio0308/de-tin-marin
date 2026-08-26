import { ABOUT_STORY_IMAGE_URL } from "@/modules/about/data/about.data";

export function resolveAboutStoryImageUrl(
  imageUrl: string | null | undefined,
): string {
  if (typeof imageUrl !== "string") {
    return ABOUT_STORY_IMAGE_URL;
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return ABOUT_STORY_IMAGE_URL;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return ABOUT_STORY_IMAGE_URL;
    }
    return trimmed;
  } catch {
    return ABOUT_STORY_IMAGE_URL;
  }
}
