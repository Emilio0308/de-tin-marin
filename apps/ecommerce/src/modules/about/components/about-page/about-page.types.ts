import type {
  AboutBrandContent,
  AboutContactLinks,
} from "@/modules/about/data/about.data";

export interface AboutPageProps {
  content: AboutBrandContent;
  contact: AboutContactLinks;
}
