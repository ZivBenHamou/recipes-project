import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(name, email.trim(), password);
      nav("/profile");
    } catch (e: any) {
      setErr(e?.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create an account to manage your recipes.
        </p>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min 6 chars)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <button
          disabled={busy}
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>

        <div className="text-center text-sm text-zinc-400">
          Have an account?{" "}
          <Link className="text-zinc-100 hover:underline" to="/login">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
