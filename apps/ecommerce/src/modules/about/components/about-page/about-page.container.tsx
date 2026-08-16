import {
  ABOUT_BRAND_CONTENT,
  ABOUT_FACEBOOK_HREF,
  ABOUT_TIKTOK_HREF,
} from "@/modules/about/data/about.data";
import { supabaseConfig } from "@/config/env";
import { buildStorefrontContactLinks } from "@/modules/business-settings/helpers/build-contact-links";
import { getPublicBusinessSettingsService } from "@/modules/business-settings/services/public-business-settings.service";
import { AboutPage } from "./about-page";

export async function AboutPageContainer() {
  const settingsResult = await getPublicBusinessSettingsService(supabaseConfig);

  if (!settingsResult.ok) {
    throw new Error("BUSINESS_SETTINGS_UNAVAILABLE");
  }

  const contactLinks = buildStorefrontContactLinks(settingsResult.data);

  return (
    <AboutPage
      content={ABOUT_BRAND_CONTENT}
      contact={{
        ...contactLinks,
        facebookHref: ABOUT_FACEBOOK_HREF,
        tiktokHref: ABOUT_TIKTOK_HREF,
      }}
    />
  );
}
