import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  hasAdminConfiguration,
  isValidSessionToken,
} from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Entrar | Larissa Vital",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (hasAdminConfiguration() && (await isValidSessionToken(token)))
    redirect("/admin");
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-primary">
      <section className="w-full max-w-md border border-primary/15 bg-card p-7 shadow-sm sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
          Larissa Vital
        </p>
        <h1 className="mt-3 font-serif text-4xl">Área administrativa</h1>
        <p className="mt-2 text-sm text-primary/65">
          Entre para acessar o painel.
        </p>
        <form
          className="mt-8 space-y-5"
          action="/api/admin/login"
          method="post"
        >
          <label className="block text-sm font-medium">
            Usuário
            <input
              className="mt-2 block w-full rounded-md border border-primary/20 bg-background px-3 py-3 outline-none focus:border-accent"
              name="username"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Senha
            <input
              className="mt-2 block w-full rounded-md border border-primary/20 bg-background px-3 py-3 outline-none focus:border-accent"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {params.error === "1" && (
            <p className="text-sm text-accent" role="alert">
              Credenciais inválidas.
            </p>
          )}
          <button
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
