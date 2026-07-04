import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Megaphone,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { Badge } from "@de-tin-marin/ui/badge";
import { Button } from "@de-tin-marin/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@de-tin-marin/ui/table";
import { cn } from "@de-tin-marin/shared/cn";
import { DashboardPeriodFilter } from "./dashboard-period-filter";
import type {
  DashboardPageProps,
  DashboardStatCard,
} from "./dashboard-page.types";

const statToneClasses = {
  primary: {
    card: "soft-glow-pink border-primary/15",
    icon: "bg-primary-fixed text-on-primary-fixed",
  },
  secondary: {
    card: "soft-glow-turquoise border-secondary/15",
    icon: "bg-secondary-container text-on-secondary-container",
  },
  tertiary: {
    card: "border-tertiary/15 shadow-sm",
    icon: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
} as const;

function StatIcon({ stat }: { stat: DashboardStatCard }) {
  const className = "h-5 w-5";
  if (stat.icon === "products")
    return <Package className={className} aria-hidden />;
  if (stat.icon === "campaigns")
    return <Megaphone className={className} aria-hidden />;
  return <ShoppingCart className={className} aria-hidden />;
}

function DashboardStatCardView({ stat }: { stat: DashboardStatCard }) {
  const tone = statToneClasses[stat.tone];

  return (
    <article
      className={cn(
        "bg-surface-container-lowest min-w-[11.5rem] shrink-0 snap-start rounded-[20px] border p-4 sm:min-w-0 sm:p-6 lg:rounded-[24px]",
        tone.card,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="font-label text-label-bold text-on-surface-variant">
          {stat.label}
        </p>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tone.icon,
          )}
        >
          <StatIcon stat={stat} />
        </span>
      </div>
      <p className="font-display text-price-display text-on-surface mb-1">
        {stat.value}
      </p>
      <p className="font-body text-body-md text-on-surface-variant flex items-center gap-1">
        {stat.id === "products" ? (
          <TrendingUp className="text-secondary h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        {stat.id === "orders" ? (
          <ChevronRight
            className="text-tertiary h-4 w-4 shrink-0"
            aria-hidden
          />
        ) : null}
        <span>{stat.hint}</span>
      </p>
    </article>
  );
}

export function DashboardPage({
  labels,
  stats,
  recentOrders,
  alerts,
}: DashboardPageProps) {
  return (
    <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md relative flex flex-1 flex-col pb-28 lg:p-8 lg:pb-8">
      <header className="gap-stack-md flex flex-col">
        <div className="space-y-2">
          <h1 className="font-display text-on-surface lg:text-headline-md text-[32px] font-extrabold leading-10">
            {labels.welcome}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
            {labels.subtitle}
          </p>
        </div>
        <div className="hidden lg:block lg:self-end">
          <DashboardPeriodFilter
            dailyLabel={labels.periodDaily}
            weeklyLabel={labels.periodWeekly}
            monthlyLabel={labels.periodMonthly}
          />
        </div>
      </header>

      <section className="-mx-margin-mobile px-margin-mobile sm:gap-stack-md flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {stats.map((stat) => (
          <DashboardStatCardView key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="gap-stack-md grid xl:grid-cols-[1.6fr_1fr]">
        <article className="soft-glow-pink bg-surface-container-lowest border-surface-container-high rounded-[20px] border p-4 sm:p-6 lg:rounded-[24px]">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-headline-md text-on-surface">
              {labels.recentOrdersTitle}
            </h2>
            <Link href="/orders" className="self-start">
              <Button variant="secondary" className="min-h-11">
                {labels.viewAllOrders}
              </Button>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.emptyOrders}
            </p>
          ) : (
            <>
              <ul className="space-y-3 lg:hidden">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={order.href}
                      className="bg-surface-container-low hover:bg-surface-container flex gap-3 rounded-[16px] p-4 transition-colors"
                    >
                      <span className="bg-primary-fixed text-on-primary-fixed flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                        <User className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-body text-body-md text-on-surface truncate font-medium">
                              {order.customer}
                            </p>
                            <p className="font-body text-body-md text-on-surface-variant mt-0.5">
                              {order.orderId} • {order.timeAgo}
                            </p>
                          </div>
                          <Badge variant={order.statusVariant}>
                            {order.statusLabel}
                          </Badge>
                        </div>
                        <p className="font-body text-body-md text-on-surface-variant mt-2">
                          {order.lineSummary}
                        </p>
                      </div>
                      <ChevronRight
                        className="text-outline mt-1 h-5 w-5 shrink-0"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{labels.columnOrderId}</TableHead>
                      <TableHead>{labels.columnCustomer}</TableHead>
                      <TableHead>{labels.columnProduct}</TableHead>
                      <TableHead>{labels.columnAmount}</TableHead>
                      <TableHead>{labels.columnStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{order.lineSummary}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant={order.statusVariant}>
                            {order.statusLabel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </article>

        <article className="bg-surface-container-lowest border-surface-container-high rounded-[20px] border p-4 sm:p-6 lg:rounded-[24px]">
          <h2 className="font-display text-headline-md text-on-surface mb-4 lg:mb-6">
            <span className="lg:hidden">{labels.inventoryAlertsTitle}</span>
            <span className="hidden lg:inline">{labels.activityTitle}</span>
          </h2>

          {alerts.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.emptyAlerts}
            </p>
          ) : (
            <ul className="space-y-4">
              {alerts.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="bg-error-container text-on-error-container flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-body text-body-md text-on-surface">
                      {item.message}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="gap-stack-md hidden lg:grid lg:grid-cols-[1fr_auto] lg:items-stretch">
        <article className="bg-tertiary-fixed/40 border-tertiary/20 flex flex-col justify-center gap-3 rounded-[24px] border p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <Sparkles
              className="text-tertiary mt-1 h-6 w-6 shrink-0"
              aria-hidden
            />
            <div>
              <h3 className="font-display text-headline-md text-on-surface">
                {labels.alertTitle}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant mt-2 max-w-xl">
                {labels.alertDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{labels.alertPriority}</Badge>
            <Badge variant="muted">{labels.alertTag}</Badge>
          </div>
        </article>
        <Link href="/products/new" className="self-stretch">
          <Button className="h-full min-h-14 w-full px-8 lg:min-w-56">
            <Plus className="mr-2 h-5 w-5" aria-hidden />
            {labels.quickAdd}
          </Button>
        </Link>
      </section>

      <Link
        href="/products/new"
        aria-label={labels.quickAdd}
        className="press-down bg-primary text-on-primary fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}
