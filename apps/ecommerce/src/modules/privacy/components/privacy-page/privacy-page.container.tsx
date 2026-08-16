import { PRIVACY_CONTENT } from "@/modules/privacy/data/privacy.data";
import { PrivacyPage } from "./privacy-page";

export function PrivacyPageContainer() {
  return <PrivacyPage content={PRIVACY_CONTENT} />;
}
