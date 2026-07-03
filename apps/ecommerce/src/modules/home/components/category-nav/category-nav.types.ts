import type {
  HomeCategory,
  HomeCategoryId,
} from "@/modules/home/types/home.types";

export interface CategoryNavProps {
  categories: HomeCategory[];
  activeId: HomeCategoryId;
}
