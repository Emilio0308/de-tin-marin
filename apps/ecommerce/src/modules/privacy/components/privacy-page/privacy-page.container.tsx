import { supabaseConfig } from "@/config/env";
import { buildLegalContactInfo } from "@/modules/business-settings/helpers/build-contact-links";
import { getPublicBusinessSettingsService } from "@/modules/business-settings/services/public-business-settings.service";
import { buildPrivacyContent } from "@/modules/privacy/data/privacy.data";
import { PrivacyPage } from "./privacy-page";

export async function PrivacyPageContainer() {
  const settingsResult = await getPublicBusinessSettingsService(supabaseConfig);

  if (!settingsResult.ok) {
    throw new Error("BUSINESS_SETTINGS_UNAVAILABLE");
  }

  return (
    <PrivacyPage
      content={buildPrivacyContent(buildLegalContactInfo(settingsResult.data))}
    />
  );
}
