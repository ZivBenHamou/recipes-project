import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFavorites, toggleFavorite } from "../utils/favorites";


type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
};

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-white/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Toast
  const [toast, setToast] = useState<string | null>(null);

  // ✅ Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavorites());

  useEffect(() => {
    const t = localStorage.getItem("toast");
    if (t) {
      setToast(t);
      localStorage.removeItem("toast");
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // ✅ Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ✅ Fetch
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);

    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/recipes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRecipes(data))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  function onToggleFavorite(e: React.MouseEvent, id: string) {
    e.preventDefault(); // שלא ינווט עם ה-Link
    e.stopPropagation();

    const nowFav = toggleFavorite(id);
    setFavoriteIds(getFavorites());


    setToast(nowFav ? "Added to favorites ❤️" : "Removed from favorites");
    setTimeout(() => setToast(null), 2000);
  }

  // ✅ Dynamic categories (based on current results)
  const categories = Array.from(
    new Set(recipes.map((r) => r.category).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      {/* ✅ Toast UI */}
      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-lg">
          {toast}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Discover recipes</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search by name or category. Save and share your favorites.
          </p>
        </div>

        <Link
          to="/add"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + Add recipe
        </Link>
      </div>

      {/* Search + filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Search recipes…"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : recipes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-lg font-semibold tracking-tight">No recipes found</div>
          <div className="mt-2 text-sm text-zinc-400">
            Try clearing filters, or create your first recipe.
          </div>

          <div className="mt-5 flex gap-3">
            <Link
              to="/add"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              + Add recipe
            </Link>

            <button
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => {
            const fav = favoriteIds.includes(r.id);

            return (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:bg-white/10"
              >
                {/* ❤️ Favorite */}
                <button
                  onClick={(e) => onToggleFavorite(e, r.id)}
                  aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                  className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 p-2 backdrop-blur transition hover:bg-black/70"
                >
                  <HeartIcon filled={fav} />
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
            );
          })}
        </div>
      )}
    </div>
  );
}
