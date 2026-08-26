import { supabaseConfig } from "@/config/env";
import { buildLegalContactInfo } from "@/modules/business-settings/helpers/build-contact-links";
import { getPublicBusinessSettingsService } from "@/modules/business-settings/services/public-business-settings.service";
import { buildTermsContent } from "@/modules/terms/data/terms.data";
import { TermsPage } from "./terms-page";

export async function TermsPageContainer() {
  const settingsResult = await getPublicBusinessSettingsService(supabaseConfig);

  if (!settingsResult.ok) {
    throw new Error("BUSINESS_SETTINGS_UNAVAILABLE");
  }

  return (
    <TermsPage
      content={buildTermsContent(buildLegalContactInfo(settingsResult.data))}
    />
  );
}
