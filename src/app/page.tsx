import { createClient } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black">
        <h1 className="text-5xl font-bold text-white">realdump</h1>
        <p className="text-zinc-400">Comparte videos cortos</p>
        <div className="flex gap-4">
          <a
            href="/auth/login"
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </a>
          <a
            href="/auth/register"
            className="rounded bg-zinc-800 px-6 py-2 text-white hover:bg-zinc-700"
          >
            Registrarse
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <h1 className="text-xl font-bold text-white">realdump</h1>
        <AuthButton email={user.email ?? null} />
      </header>

      <main className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">
          Bienvenido, {user.email} — el feed de videos aparecerá aquí
        </p>
      </main>
    </div>
  );
}
