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
    <aside className="space-y-stack-md w-full lg:w-1/4">
      <h2 className="font-display text-headline-md text-on-surface mb-4">
        {title}
      </h2>
      <nav className="flex flex-col gap-2">
        <button
          type="button"
          aria-pressed={!activeCategoryId}
          onClick={() => onCategoryChange(undefined)}
          className={cn(
            "font-label text-label-bold rounded-xl p-3 text-left transition-all",
            !activeCategoryId
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container",
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
                "font-label text-label-bold rounded-xl p-3 text-left transition-all",
                isActive
                  ? "bg-primary-container/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container",
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
