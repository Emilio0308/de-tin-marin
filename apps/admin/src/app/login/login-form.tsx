"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, LogIn } from "lucide-react";
import { createAdminBrowserClient } from "@/shared/clients/supabase-browser";

const fieldClass =
  "border-outline-variant/20 focus:border-secondary focus:ring-secondary/10 bg-surface-container-lowest font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 h-12 w-full rounded-lg border-2 px-4 outline-none transition-all focus:ring-4";

export function LoginForm() {
  const t = useTranslations("login");
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
      onSubmit={(event) => void handleSubmit(event)}
      className="gap-stack-md flex w-full flex-col"
    >
      <div className="group flex flex-col gap-2">
        <label
          htmlFor="email"
          className="font-label text-label-bold text-on-surface-variant group-focus-within:text-primary ml-1 transition-colors"
        >
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className={fieldClass}
        />
      </div>

      <div className="group flex flex-col gap-2">
        <label
          htmlFor="password"
          className="font-label text-label-bold text-on-surface-variant group-focus-within:text-primary ml-1 transition-colors"
        >
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          className={fieldClass}
        />
      </div>

      {error ? (
        <p className="text-error font-body text-body-md" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-on-primary hover:bg-primary-container press-down shadow-primary/20 font-label text-label-bold mt-stack-sm flex h-14 w-full items-center justify-center gap-2 rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span>{t("loading")}</span>
          </>
        ) : (
          <>
            <span>{t("submit")}</span>
            <LogIn className="h-5 w-5" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
