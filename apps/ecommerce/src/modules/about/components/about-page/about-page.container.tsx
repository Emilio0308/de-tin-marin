import {
  ABOUT_BRAND_CONTENT,
  ABOUT_FACEBOOK_HREF,
  ABOUT_STORY_IMAGE_URL,
  ABOUT_TIKTOK_HREF,
} from "@/modules/about/data/about.data";
import { resolveAboutStoryImageUrl } from "@/modules/about/helpers/resolve-about-story-image-url";
import { getPublicAboutPageImageService } from "@/modules/about/services/public-about-page.service";
import { supabaseConfig } from "@/config/env";
import { buildStorefrontContactLinks } from "@/modules/business-settings/helpers/build-contact-links";
import { getPublicBusinessSettingsService } from "@/modules/business-settings/services/public-business-settings.service";
import { AboutPage } from "./about-page";

export async function AboutPageContainer() {
  const [settingsResult, aboutImageResult] = await Promise.all([
    getPublicBusinessSettingsService(supabaseConfig),
    getPublicAboutPageImageService(supabaseConfig),
  ]);

  if (!settingsResult.ok) {
    throw new Error("BUSINESS_SETTINGS_UNAVAILABLE");
  }

  const storyImageUrl = aboutImageResult.ok
    ? resolveAboutStoryImageUrl(aboutImageResult.data.imageUrl)
    : ABOUT_STORY_IMAGE_URL;

  const contactLinks = buildStorefrontContactLinks(settingsResult.data);

  return (
    <AboutPage
      content={{ ...ABOUT_BRAND_CONTENT, storyImageUrl }}
      contact={{
        ...contactLinks,
        facebookHref: ABOUT_FACEBOOK_HREF,
        tiktokHref: ABOUT_TIKTOK_HREF,
      }}
    />
  );
}
