export interface HeroSlideProps {
  imageUrl: string;
  altText: string | null;
}

export interface HeroSectionProps {
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  ctaSurprises: string;
  ctaProducts: string;
  imageAlt: string;
  favoriteKit: string;
  displayMode: "static" | "carousel";
  slides: HeroSlideProps[];
  prevLabel: string;
  nextLabel: string;
}
