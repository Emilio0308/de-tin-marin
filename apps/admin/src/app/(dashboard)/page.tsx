import { Button } from "@de-tin-marin/ui/button";
import Link from "next/link";
import { getHealth } from "@/app/actions/get-health";

export default async function DashboardHomePage() {
  const health = await getHealth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold">Panel administrativo</h1>
      <p className="text-zinc-600">
        Backoffice De Tin Marín. Estado: {health.status} ({health.app})
      </p>
      <div className="flex gap-3">
        <Link href="/categories">
          <Button>Gestionar categorías</Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary">Gestionar productos</Button>
        </Link>
      </div>
    </div>
  );
}
