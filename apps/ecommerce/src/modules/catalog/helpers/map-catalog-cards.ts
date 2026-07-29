import type {
  PublicBundleListItem,
  PublicPackListItem,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import { CATALOG_PLACEHOLDER_IMAGE } from "../constants";
import type {
  HomeBundle,
  HomePack,
  HomeProduct,
} from "@/modules/home/types/home.types";

export function mapProductToCard(item: PublicProductListItem): HomeProduct {
  return {
    id: item.id,
    name: item.name,
    price: item.finalPrice,
    imageUrl: item.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
    imageAlt: item.name,
  };
}

export function mapBundleToCard(item: PublicBundleListItem): HomeBundle {
  return {
    id: item.id,
    name: item.name,
    price: item.total,
    imageUrl: item.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
    imageAlt: item.name,
    features: item.itemsPreview.map((preview) => ({
      id: preview.id,
      label: preview.label,
    })),
  };
}

export function mapPackToCard(item: PublicPackListItem): HomePack {
  return {
    id: item.id,
    name: item.name,
    price: item.finalPrice,
    imageUrl: item.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
    imageAlt: item.name,
    features: item.itemsPreview.map((preview) => ({
      id: preview.id,
      label: preview.label,
    })),
  };
}
