"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import { createAdminBrowserClient } from "@/shared/clients/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createAdminBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(event);
      }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
