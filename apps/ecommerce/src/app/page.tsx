import { Button } from "@de-tin-marin/ui/button";
import { getHealth } from "@/app/actions/get-health";

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-rose-600">
        De Tin Marín
      </p>
      <h1 className="text-4xl font-bold">Tienda de dulces y sorpresas</h1>
      <p className="text-lg text-zinc-600">
        Ecommerce en construcción. Estado: {health.status} ({health.app})
      </p>
      <Button>Explorar catálogo</Button>
    </main>
  );
}
