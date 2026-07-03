import type {
  HomeCategory,
  HomeCategoryId,
  HomeProduct,
} from "@/modules/home/types/home.types";

export interface ProductCatalogProps {
  categories: HomeCategory[];
  products: HomeProduct[];
  activeCategoryId: HomeCategoryId;
}
