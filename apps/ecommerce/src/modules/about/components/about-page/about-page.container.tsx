import {
  ABOUT_BRAND_CONTENT,
  ABOUT_CONTACT_LINKS,
} from "@/modules/about/data/about.data";
import { AboutPage } from "./about-page";

export function AboutPageContainer() {
  return (
    <AboutPage content={ABOUT_BRAND_CONTENT} contact={ABOUT_CONTACT_LINKS} />
  );
}
