import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getTranslations("login");

  return (
    <main className="bg-background px-margin-mobile relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="bg-primary pointer-events-none fixed right-[-10%] top-[-10%] -z-10 h-2/5 w-2/5 rounded-full opacity-[0.03] blur-[100px]"
        aria-hidden
      />
      <div
        className="bg-secondary pointer-events-none fixed bottom-[-10%] left-[-10%] -z-10 h-2/5 w-2/5 rounded-full opacity-[0.03] blur-[100px]"
        aria-hidden
      />

      <div className="soft-glow-pink bg-surface-container-lowest border-outline-variant/10 p-stack-lg flex w-full max-w-md flex-col items-center rounded-3xl border">
        <div className="mb-stack-lg text-center">
          <span className="font-label text-label-bold text-primary mb-1 block uppercase tracking-widest">
            {t("brand")}
          </span>
          <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-none tracking-tight">
            {t("title")}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant/70 mt-2">
            {t("subtitle")}
          </p>
        </div>

        <LoginForm />

        <div className="border-surface-variant mt-stack-lg pt-stack-md w-full border-t text-center">
          <p className="font-body text-on-surface-variant text-[13px]">
            {t("forgotPrefix")}{" "}
            <a
              href="mailto:soporte@detinmarin.com"
              className="text-secondary font-bold hover:underline"
            >
              {t("contactSupport")}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
