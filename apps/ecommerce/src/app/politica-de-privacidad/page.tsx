import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPageContainer } from "@/modules/privacy/components/privacy-page/privacy-page.container";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return {
    title: t("eyebrow"),
    description: t("heroDescription"),
  };
}

export default function PrivacyPolicyRoute() {
  return <PrivacyPageContainer />;
}
