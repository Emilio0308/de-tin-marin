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
  benefits: [string, string, string];
  imageAlt: string;
  favoriteKit: string;
  displayMode: "static" | "carousel";
  slides: HeroSlideProps[];
  prevLabel: string;
  nextLabel: string;
  pauseLabel: string;
  resumeLabel: string;
  carouselLabel: string;
  slideLabel: (index: number, total: number) => string;
}
