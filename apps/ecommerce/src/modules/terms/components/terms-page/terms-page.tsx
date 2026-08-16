"use client";

import {
  Gift,
  Mail,
  MapPin,
  MessageCircle,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { getTermsTocItems } from "./terms-page.helpers";
import type { TermsPageProps } from "./terms-page.types";

export function TermsPage({ content }: TermsPageProps) {
  const t = useTranslations("terms");
  const toc = getTermsTocItems(content.sections);
  const { contact } = content;

  return (
    <StorefrontLayout>
      <section className="px-gutter py-stack-lg relative overflow-hidden md:py-16">
        <div
          className="bg-secondary-fixed pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-tertiary-fixed pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full opacity-30 blur-3xl"
          aria-hidden
        />

        <div className="container-max relative z-10 max-w-3xl">
          {/* Firma visual: etiqueta de regalo — claridad antes de abrir la sorpresa */}
          <div className="mb-stack-md inline-flex max-w-full flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span className="bg-secondary-fixed text-on-secondary-fixed font-label text-label-bold inline-flex items-center gap-2 rounded-full px-4 py-1">
              <ScrollText className="h-4 w-4" aria-hidden />
              {t("eyebrow")}
            </span>
            <span className="border-secondary/25 bg-surface-container-lowest text-secondary font-label text-label-bold inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5">
              <Gift className="h-4 w-4" aria-hidden />
              {t("giftTag")}
            </span>
          </div>

          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-secondary mb-stack-md flex flex-wrap items-center gap-3">
            <span>{t("heroTitle")}</span>
            <Sparkles
              className="text-secondary h-8 w-8 shrink-0 md:h-10 md:w-10"
              aria-hidden
            />
          </h1>

          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            {t("heroDescription")}
          </p>

          <p className="font-label text-label-bold text-on-primary-fixed-variant bg-primary-fixed/50 mt-stack-md inline-block rounded-full px-4 py-2">
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
                    className="font-body text-body-sm text-on-surface-variant hover:text-secondary hover:bg-secondary-fixed/40 focus-visible:ring-secondary block cursor-pointer rounded-lg px-3 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
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
                  className="font-label text-label-bold text-on-surface-variant hover:text-secondary hover:bg-secondary-fixed/50 focus-visible:ring-secondary whitespace-nowrap rounded-full px-3 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.title.replace(/^\d+\.\s*/, "")}
                </a>
              ))}
            </div>
          </nav>

          <article className="bg-surface-container-lowest border-surface-container soft-glow-turquoise p-stack-md md:p-stack-lg max-w-prose rounded-3xl border">
            <div className="border-secondary/20 mb-stack-lg space-y-4 border-l-4 pl-4">
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

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="font-body text-body-md text-on-surface-variant mb-4 leading-relaxed last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.list ? (
                    <div className="mt-4 space-y-4">
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
                              className="bg-secondary mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
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

                  {section.showContact ? (
                    <dl className="bg-surface-container-low mt-stack-sm space-y-3 rounded-2xl p-4">
                      <div className="gap-stack-sm flex flex-col sm:flex-row sm:items-baseline">
                        <dt className="font-label text-label-bold text-on-surface shrink-0">
                          {t("contactEmail")}
                        </dt>
                        <dd className="min-w-0">
                          <a
                            href={contact.emailHref}
                            className="font-body text-body-md text-secondary hover:text-on-secondary-fixed-variant focus-visible:ring-secondary cursor-pointer underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2"
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
                            className="font-body text-body-md text-secondary hover:text-on-secondary-fixed-variant focus-visible:ring-secondary cursor-pointer underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2"
                          >
                            {contact.whatsappDisplay}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="bg-primary-container mt-stack-lg p-stack-md md:p-stack-lg relative overflow-hidden rounded-2xl text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--color-on-primary-container) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
                aria-hidden
              />

              <div className="relative z-10 mx-auto max-w-lg">
                <p className="font-display text-headline-md text-on-primary-container mb-2">
                  {contact.legalName}
                </p>
                <p className="font-body text-body-md text-on-primary-container mb-stack-md opacity-90">
                  {t("contactFooterNote")}
                </p>

                <div className="gap-stack-sm flex flex-col items-stretch sm:items-center">
                  <a
                    href={contact.emailHref}
                    className="press-down bg-surface-container-lowest text-on-surface font-label text-label-bold focus-visible:ring-secondary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98]"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    {contact.email}
                  </a>
                  <a
                    href={contact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-down soft-glow-turquoise bg-secondary text-on-secondary font-label text-label-bold focus-visible:ring-secondary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {contact.whatsappDisplay}
                  </a>
                  {contact.legalAddress ? (
                    <p className="font-body text-body-sm text-on-primary-container mt-2 inline-flex items-center justify-center gap-2 opacity-90">
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
