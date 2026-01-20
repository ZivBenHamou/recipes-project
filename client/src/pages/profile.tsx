import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
};

export default function Profile() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes`);
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    const ok = confirm("Delete this recipe?");
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your recipes (temporary — later we’ll connect users).
          </p>
        </div>

        <Link
          to="/add"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + Add recipe
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400">Loading…</div>
      ) : recipes.length === 0 ? (
        <div className="text-sm text-zinc-400">No recipes yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <Link to={`/recipe/${r.id}`} className="block">
                <div className="aspect-[16/10] w-full bg-zinc-900">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </Link>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{r.title}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {r.category} • {r.prepMinutes} min
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    {deletingId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/edit/${r.id}`}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-zinc-200 hover:bg-white/10"
                  >
                    Edit (next)
                  </Link>
                  <Link
                    to={`/recipe/${r.id}`}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-zinc-200 hover:bg-white/10"
                  >
                    Open
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
