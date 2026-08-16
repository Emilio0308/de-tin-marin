import { cn } from "@de-tin-marin/shared/cn";
import type { PublicCategoryItem } from "@de-tin-marin/validations/public-catalog";

export type CategoryFilterProps = {
  title: string;
  allLabel: string;
  categories: PublicCategoryItem[];
  activeCategoryId?: string;
  onCategoryChange: (categoryId?: string) => void;
};

export function CategoryFilter({
  title,
  allLabel,
  categories,
  activeCategoryId,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <aside className="space-y-stack-md w-full lg:sticky lg:top-28 lg:h-fit lg:w-1/4">
      <h2 className="font-display text-headline-md text-on-surface mb-4">
        {title}
      </h2>
      <nav className="border-outline-variant/20 bg-surface-container-lowest flex gap-2 overflow-x-auto rounded-2xl border p-2 shadow-sm lg:flex-col lg:overflow-visible">
        <button
          type="button"
          aria-pressed={!activeCategoryId}
          onClick={() => onCategoryChange(undefined)}
          className={cn(
            "font-label text-label-bold focus-visible:ring-primary min-h-11 shrink-0 rounded-xl px-4 py-3 text-left transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 lg:w-full",
            !activeCategoryId
              ? "bg-primary-container/15 text-primary shadow-sm"
              : "text-on-surface-variant hover:bg-primary-fixed/35",
          )}
        >
          {allLabel}
        </button>
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "font-label text-label-bold focus-visible:ring-primary min-h-11 shrink-0 rounded-xl px-4 py-3 text-left transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 lg:w-full",
                isActive
                  ? "bg-primary-container/15 text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-primary-fixed/35",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
