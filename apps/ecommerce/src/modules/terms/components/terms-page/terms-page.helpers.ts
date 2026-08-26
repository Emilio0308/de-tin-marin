import type {
  TermsSection,
  TermsSectionId,
} from "@/modules/terms/data/terms.data";

export function termsSectionHref(id: TermsSectionId): string {
  return `#${id}`;
}

export function getTermsTocItems(
  sections: TermsSection[],
): { id: TermsSectionId; title: string; href: string }[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    href: termsSectionHref(section.id),
  }));
}
