import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { AdminFormPageHeaderProps } from "./admin-form-page-header.types";

export function AdminFormPageHeader({
  backHref,
  backLabel,
  breadcrumbParent,
  breadcrumbCurrent,
  title,
  subtitle,
}: AdminFormPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href={backHref}
        className="text-secondary font-label text-label-bold inline-flex w-fit items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
      <nav
        className="font-label text-on-surface-variant flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide"
        aria-label="Breadcrumb"
      >
        <span>{breadcrumbParent}</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <span className="text-primary">{breadcrumbCurrent}</span>
      </nav>
      <div className="space-y-2">
        <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="font-body text-body-md text-on-surface-variant">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
