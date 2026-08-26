"use client";

import { Heart, Mail, MapPin, MessageCircle, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { getPrivacyTocItems } from "./privacy-page.helpers";
import type { PrivacyPageProps } from "./privacy-page.types";

export function PrivacyPage({ content }: PrivacyPageProps) {
  const t = useTranslations("privacy");
  const toc = getPrivacyTocItems(content.sections);
  const { contact } = content;

  return (
    <StorefrontLayout>
      <section className="px-gutter py-stack-lg relative overflow-hidden md:py-16">
        <div
          className="bg-primary-fixed pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-secondary-fixed pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
          aria-hidden
        />

        <div className="container-max relative z-10 max-w-3xl">
          <span className="bg-primary-fixed text-on-primary-fixed font-label text-label-bold mb-stack-sm inline-flex items-center gap-2 rounded-full px-4 py-1">
            <Shield className="h-4 w-4" aria-hidden />
            {t("eyebrow")}
          </span>

          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-stack-md flex flex-wrap items-center gap-3">
            <span>{t("heroTitle")}</span>
            <Heart
              className="text-primary h-8 w-8 shrink-0 md:h-10 md:w-10"
              aria-hidden
              fill="currentColor"
            />
          </h1>

          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            {t("heroDescription")}
          </p>

          <p className="font-label text-label-bold text-secondary bg-secondary-fixed/40 mt-stack-md inline-block rounded-full px-4 py-2">
            {t("lastUpdated", { date: content.lastUpdated })}
          </p>
        </div>
      </section>

      <section className="px-gutter pb-stack-lg">
        <div className="container-max gap-gutter grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav
            aria-label={t("tocLabel")}
            className="lg:sticky lg:top-[calc(var(--spacing-storefront-header)+1rem)] lg:self-start"
          >
            <p className="font-label text-label-bold text-on-surface mb-3 hidden lg:block">
              {t("tocLabel")}
            </p>
            <ul className="hidden flex-col gap-1 lg:flex">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="font-body text-body-sm text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 focus-visible:ring-primary block cursor-pointer rounded-lg px-3 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>

            <div className="bg-surface-container-low border-outline-variant/40 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border p-2 lg:hidden">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="font-label text-label-bold text-on-surface-variant hover:text-primary hover:bg-primary-fixed/50 focus-visible:ring-primary whitespace-nowrap rounded-full px-3 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.title.replace(/^\d+\.\s*/, "")}
                </a>
              ))}
            </div>
          </nav>

          <article className="bg-surface-container-lowest border-surface-container soft-glow-pink p-stack-md md:p-stack-lg max-w-prose rounded-3xl border">
            <div className="mb-stack-lg space-y-4">
              {content.introParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-body text-body-md text-on-surface-variant leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="gap-stack-lg flex flex-col">
              {content.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-[calc(var(--spacing-storefront-header)+1.5rem)]"
                >
                  <h2 className="font-display text-headline-md text-on-surface mb-stack-sm">
                    {section.title}
                  </h2>

                  {section.list ? (
                    <div className="space-y-4">
                      {section.list.lead ? (
                        <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                          {section.list.lead}
                        </p>
                      ) : null}

                      <ul className="space-y-2.5">
                        {section.list.items.map((item) => (
                          <li
                            key={item}
                            className="font-body text-body-md text-on-surface-variant flex gap-3 leading-relaxed"
                          >
                            <span
                              className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                              aria-hidden
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {section.list.notes?.map((note) => (
                        <p
                          key={note}
                          className="font-body text-body-md text-on-surface-variant leading-relaxed"
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="font-body text-body-md text-on-surface-variant mb-4 leading-relaxed last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.id === "rights" ? (
                    <dl className="bg-surface-container-low mt-stack-sm space-y-3 rounded-2xl p-4">
                      <div className="gap-stack-sm flex flex-col sm:flex-row sm:items-baseline">
                        <dt className="font-label text-label-bold text-on-surface shrink-0">
                          {t("contactEmail")}
                        </dt>
                        <dd className="min-w-0">
                          <a
                            href={contact.emailHref}
                            className="font-body text-body-md text-primary hover:text-primary-container focus-visible:ring-primary cursor-pointer underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2"
                          >
                            {contact.email}
                          </a>
                        </dd>
                      </div>
                      <div className="gap-stack-sm flex flex-col sm:flex-row sm:items-baseline">
                        <dt className="font-label text-label-bold text-on-surface shrink-0">
                          {t("contactWhatsapp")}
                        </dt>
                        <dd className="min-w-0">
                          <a
                            href={contact.whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-body text-body-md text-primary hover:text-primary-container focus-visible:ring-primary cursor-pointer underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2"
                          >
                            {contact.whatsappDisplay}
                          </a>
                        </dd>
                      </div>
                      <div className="gap-stack-sm flex flex-col sm:flex-row sm:items-baseline">
                        <dt className="font-label text-label-bold text-on-surface shrink-0">
                          {t("contactLegalName")}
                        </dt>
                        <dd className="font-body text-body-md text-on-surface-variant">
                          {contact.legalName}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="bg-secondary-container mt-stack-lg p-stack-md md:p-stack-lg relative overflow-hidden rounded-2xl text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--color-secondary) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
                aria-hidden
              />

              <div className="relative z-10 mx-auto max-w-lg">
                <p className="font-display text-headline-md text-on-secondary-container mb-2">
                  {contact.legalName}
                </p>
                <p className="font-body text-body-md text-on-secondary-container mb-stack-md opacity-90">
                  {t("contactFooterNote")}
                </p>

                <div className="gap-stack-sm flex flex-col items-stretch sm:items-center">
                  <a
                    href={contact.emailHref}
                    className="press-down bg-surface-container-lowest text-on-surface font-label text-label-bold focus-visible:ring-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98]"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    {contact.email}
                  </a>
                  <a
                    href={contact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-down soft-glow-pink bg-primary text-on-primary font-label text-label-bold focus-visible:ring-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {contact.whatsappDisplay}
                  </a>
                  {contact.legalAddress ? (
                    <p className="font-body text-body-sm text-on-secondary-container mt-2 inline-flex items-center justify-center gap-2 opacity-90">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{contact.legalAddress}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </StorefrontLayout>
  );
}
