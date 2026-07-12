"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"creator" | "viewer">("viewer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split("@")[0],
          role: role === "creator" ? "pending" : "viewer",
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/auth/login?registered=true");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <form
        onSubmit={handleRegister}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-center text-xl font-bold text-white">Crear cuenta</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500 border-b border-zinc-800"
        />

        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full bg-transparent px-0 py-2 text-sm text-white placeholder-zinc-500 outline-none caret-blue-500 border-b border-zinc-800"
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-400">Tipo de cuenta</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("viewer")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                role === "viewer"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium">Espectador</div>
              <div className="mt-0.5 text-xs opacity-70">Ver y comentar</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("creator")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                role === "creator"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium">Creador</div>
              <div className="mt-0.5 text-xs opacity-70">Subir videos</div>
            </button>
          </div>
          {role === "creator" && (
            <p className="text-xs text-zinc-500">
              Los creadores requieren aprobación del administrador. Mientras tanto tu cuenta estará en estado pendiente.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-lg bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="text-sm text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
