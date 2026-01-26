import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites, toggleFavorite } from "../utils/favorites";

type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={filled ? "text-red-500" : "text-white"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6c-1.5-1.5-3.9-1.5-5.4 0L12 8l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0s-1.5 3.9 0 5.4L12 21.8 20.8 10c1.5-1.5 1.5-3.9 0-5.4z" />
    </svg>
  );
}

export default function Profile() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState<"my" | "favorites">("my");

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavorites());

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

  // refresh favorites when switching tabs (וגם אם חזרת לעמוד)
  useEffect(() => {
    setFavoriteIds(getFavorites());
  }, [tab]);

  const favoriteRecipes = useMemo(() => {
    const favSet = new Set(favoriteIds);
    return recipes.filter((r) => favSet.has(r.id));
  }, [recipes, favoriteIds]);

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

  function onToggleFavorite(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
    setFavoriteIds(getFavorites());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your recipes + favorites (local — later we’ll connect users).
          </p>
        </div>

        <Link
          to="/add"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + Add recipe
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("my")}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            tab === "my"
              ? "border border-white/10 bg-white/10 text-zinc-100"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          }`}
        >
          My recipes{" "}
          <span className="ml-2 rounded-lg bg-white/10 px-2 py-0.5 text-xs text-zinc-200">
            {recipes.length}
          </span>
        </button>

        <button
          onClick={() => setTab("favorites")}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            tab === "favorites"
              ? "border border-white/10 bg-white/10 text-zinc-100"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          }`}
        >
          Favorites{" "}
          <span className="ml-2 rounded-lg bg-white/10 px-2 py-0.5 text-xs text-zinc-200">
            {favoriteIds.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-zinc-400">Loading…</div>
      ) : tab === "my" ? (
        recipes.length === 0 ? (
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
        )
      ) : favoriteIds.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-lg font-semibold tracking-tight">
            No favorites yet ❤️
          </div>
          <div className="mt-2 text-sm text-zinc-400">
            Go to the home page and tap the heart on recipes you like.
          </div>

          <div className="mt-5">
            <Link
              to="/"
              className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              Browse recipes
            </Link>
          </div>
        </div>
      ) : favoriteRecipes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-lg font-semibold tracking-tight">
            Favorites not found
          </div>
          <div className="mt-2 text-sm text-zinc-400">
            It looks like some favorite recipes were deleted. Remove them from
            favorites by un-favoriting on the home page (or add new favorites).
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRecipes.map((r) => (
            <Link
              key={r.id}
              to={`/recipe/${r.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:bg-white/10"
            >
              {/* ❤️ Unfavorite */}
              <button
                onClick={(e) => onToggleFavorite(e, r.id)}
                aria-label="Remove from favorites"
                className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 p-2 backdrop-blur transition hover:bg-black/70"
              >
                <HeartIcon filled={true} />
              </button>

              <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    No image
                  </div>
                )}
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
                    {r.title}
                  </h3>
                  <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                    {r.prepMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{r.category}</span>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200">
                    Open →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
