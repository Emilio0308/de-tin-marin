import { getTranslations } from "next-intl/server";
import { ComingSoonPage } from "@/modules/home/components/coming-soon-page/coming-soon-page";

export default async function SorpresasPage() {
  const t = await getTranslations("catalog");

  return (
    <ComingSoonPage
      title={t("bundles.title")}
      description={t("bundles.comingSoon")}
      backLabel={t("backHome")}
    />
  );
}
