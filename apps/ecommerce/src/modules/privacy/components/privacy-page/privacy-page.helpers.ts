import type {
  PrivacySection,
  PrivacySectionId,
} from "@/modules/privacy/data/privacy.data";

export function privacySectionHref(id: PrivacySectionId): string {
  return `#${id}`;
}

export function getPrivacyTocItems(
  sections: PrivacySection[],
): { id: PrivacySectionId; title: string; href: string }[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    href: privacySectionHref(section.id),
  }));
}
