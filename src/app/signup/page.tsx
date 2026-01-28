import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="rounded-xl border border-zinc-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Inscription
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Choisir un type de compte
        </h1>
        <p className="mt-3 text-zinc-600">
          Crée un compte admin pour gérer les équipes ou un compte employé pour
          consulter ton planning.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Compte admin</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Créer une organisation et gérer les employés.
          </p>
          <Link
            href="/signup/admin"
            className="mt-4 inline-flex rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Continuer
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Compte employé</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Rejoindre une organisation avec un code.
          </p>
          <Link
            href="/signup/employee"
            className="mt-4 inline-flex rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Continuer
          </Link>
        </div>
      </section>
    </div>
  );
}
