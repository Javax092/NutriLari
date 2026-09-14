import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-primary sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex items-end justify-between border-b border-primary/15 pb-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              Larissa Vital
            </p>
            <h1 className="mt-2 font-serif text-5xl">Painel</h1>
            <p className="mt-3 text-sm text-primary/65">
              Visão geral da operação.
            </p>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              className="rounded-md border border-primary/20 px-3 py-2 text-sm"
              type="submit"
            >
              Sair
            </button>
          </form>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            className="rounded-md border border-primary/15 bg-card p-6 transition-colors hover:border-accent"
            href="/admin/analytics"
          >
            <p className="font-serif text-3xl">Analytics</p>
            <p className="mt-2 text-sm text-primary/65">
              Aquisição e conversão.
            </p>
          </a>
          {["Diagnósticos", "Leads", "Configurações"].map((label) => (
            <div
              className="rounded-md border border-primary/10 p-6 opacity-60"
              key={label}
            >
              <p className="font-serif text-3xl">{label}</p>
              <p className="mt-2 text-sm">Em breve</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
