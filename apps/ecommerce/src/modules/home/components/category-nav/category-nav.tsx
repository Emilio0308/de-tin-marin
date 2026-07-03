import { cn } from "@de-tin-marin/shared/cn";
import type { CategoryNavProps } from "./category-nav.types";

export function CategoryNav({ categories, activeId }: CategoryNavProps) {
  return (
    <aside className="space-y-stack-md w-full lg:w-1/4">
      <h2 className="font-display text-headline-md text-on-surface mb-4">
        Categorías
      </h2>
      <nav className="flex flex-col gap-2">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          const CategoryIcon = category.icon;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              className={cn(
                "font-label text-label-bold flex items-center gap-3 rounded-xl p-3 transition-all",
                isActive
                  ? "bg-primary-container/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container",
              )}
            >
              <CategoryIcon className="h-5 w-5" />
              {category.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
