import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-rose-600">De Tin Marín</p>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Inicia sesión con tu cuenta staff
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
