import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsPageContainer } from "@/modules/terms/components/terms-page/terms-page.container";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  return {
    title: t("eyebrow"),
    description: t("heroDescription"),
  };
}

export default function TermsRoute() {
  return <TermsPageContainer />;
}
