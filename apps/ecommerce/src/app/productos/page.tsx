import { getTranslations } from "next-intl/server";
import { ComingSoonPage } from "@/modules/home/components/coming-soon-page/coming-soon-page";

export default async function ProductosPage() {
  const t = await getTranslations("catalog");

  return (
    <ComingSoonPage
      title={t("products.title")}
      description={t("products.comingSoon")}
      backLabel={t("backHome")}
    />
  );
}
