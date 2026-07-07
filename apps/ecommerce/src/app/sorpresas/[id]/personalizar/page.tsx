import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

type PersonalizeRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonalizeRoute({
  params,
}: PersonalizeRouteProps) {
  const { id } = await params;
  const t = await getTranslations("catalog");

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-4">
          {t("wizard.comingSoonTitle")}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-8 max-w-lg">
          {t("wizard.comingSoon")}
        </p>
        <Link
          href={`/sorpresas/${id}`}
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary rounded-full px-8 py-3"
        >
          {t("bundles.backToDetail")}
        </Link>
      </section>
    </StorefrontLayout>
  );
}
