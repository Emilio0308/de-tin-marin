import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "./product-card.helpers";
import type { ProductCardProps } from "./product-card.types";

export function ProductCard({
  product,
  addToCartLabel = "Añadir",
  detailHref,
  canAddToCart = true,
  onAddToCart,
}: ProductCardProps) {
  const imageBlock = (
    <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-[20px]">
      <Image
        src={product.imageUrl}
        alt={product.imageAlt}
        fill
        sizes="(max-width: 768px) 50vw, 20rem"
        className="object-cover"
      />
      {product.badge ? (
        <span className="bg-secondary text-on-secondary absolute left-2 top-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          {product.badge}
        </span>
      ) : null}
    </div>
  );

  return (
    <article className="soft-glow-pink border-surface-container-high bg-surface-container-lowest group rounded-[24px] border p-3 transition-all duration-300 hover:scale-[1.02]">
      {detailHref ? (
        <Link href={detailHref} className="block">
          {imageBlock}
        </Link>
      ) : (
        imageBlock
      )}
      <h3 className="font-label text-label-bold text-on-surface mb-1">
        {detailHref ? (
          <Link href={detailHref} className="hover:text-primary">
            {product.name}
          </Link>
        ) : (
          product.name
        )}
      </h3>
      <p className="font-display text-primary mb-4 text-[20px] font-extrabold">
        {formatPrice(product.price)}
      </p>
      <button
        type="button"
        onClick={onAddToCart}
        disabled={!canAddToCart}
        className="press-down bg-secondary-container font-label text-label-bold text-on-secondary-container hover:bg-secondary hover:text-on-secondary disabled:bg-on-surface-variant/20 disabled:text-on-surface-variant/60 flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-all duration-300 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-5 w-5" />
        {addToCartLabel}
      </button>
    </article>
  );
}
