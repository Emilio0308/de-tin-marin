import { TERMS_CONTENT } from "@/modules/terms/data/terms.data";
import { TermsPage } from "./terms-page";

export function TermsPageContainer() {
  return <TermsPage content={TERMS_CONTENT} />;
}
