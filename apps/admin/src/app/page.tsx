import { Button } from "@de-tin-marin/ui/button";
import { getHealth } from "@/app/actions/get-health";

export default async function AdminHomePage() {
  const health = await getHealth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-zinc-200 bg-white p-6">
        <p className="text-sm font-semibold text-rose-600">De Tin Marín</p>
        <p className="mt-1 text-xs text-zinc-500">Admin</p>
        <nav className="mt-8 space-y-2 text-sm text-zinc-600">
          <p className="font-medium text-zinc-900">Dashboard</p>
          <p>Productos (S1A)</p>
          <p>Órdenes (S2B)</p>
        </nav>
      </aside>
      <main className="flex flex-1 flex-col gap-4 p-8">
        <h1 className="text-3xl font-bold">Panel administrativo</h1>
        <p className="text-zinc-600">
          Backoffice en construcción. Estado: {health.status} ({health.app})
        </p>
        <Button variant="secondary">Ver documentación S0</Button>
      </main>
    </div>
  );
}
