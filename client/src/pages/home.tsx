import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type SortMode = "newest" | "fastest" | "az";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ New filters
  const [maxMinutes, setMaxMinutes] = useState<number>(180);
  const [sort, setSort] = useState<SortMode>("newest");

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

  // ✅ Fetch (search + category stay server-side)
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
    e.preventDefault();
    e.stopPropagation();

    const nowFav = toggleFavorite(id);
    setFavoriteIds(getFavorites());

    setToast(nowFav ? "Added to favorites ❤️" : "Removed from favorites");
    setTimeout(() => setToast(null), 2000);
  }

  const categories = useMemo(() => {
    return Array.from(new Set(recipes.map((r) => r.category).filter(Boolean))).sort();
  }, [recipes]);

  // ✅ Apply client-side filters + sort
  const visibleRecipes = useMemo(() => {
    let list = recipes;

    // max minutes
    const mm = clamp(maxMinutes, 0, 9999);
    list = list.filter((r) => (Number.isFinite(r.prepMinutes) ? r.prepMinutes : 0) <= mm);

    // sort
    if (sort === "fastest") {
      list = [...list].sort((a, b) => (a.prepMinutes ?? 0) - (b.prepMinutes ?? 0));
    } else if (sort === "az") {
      list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      // newest: assume API already returns newest first; keep order
      list = [...list];
    }

    return list;
  }, [recipes, maxMinutes, sort]);

  const hasActiveExtraFilters = maxMinutes !== 180 || sort !== "newest";

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

          {!loading ? (
            <div className="mt-3 text-xs text-zinc-400">
              Showing <span className="text-zinc-200">{visibleRecipes.length}</span>{" "}
              recipes
            </div>
          ) : null}
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

      {/* Advanced filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Max minutes */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-200">Max prep time</div>
            <div className="text-sm text-zinc-200">
              <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                {maxMinutes} min
              </span>
            </div>
          </div>

          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(Number(e.target.value))}
            className="mt-3 w-full"
          />

          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>5</span>
            <span>60</span>
            <span>120</span>
            <span>180</span>
          </div>
        </div>

        {/* Sort */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="text-sm text-zinc-200">Sort</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="newest">Newest</option>
            <option value="fastest">Fastest</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        {/* Clear extra filters */}
        {hasActiveExtraFilters ? (
          <div className="sm:col-span-3">
            <button
              onClick={() => {
                setMaxMinutes(180);
                setSort("newest");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Reset advanced filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : visibleRecipes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-lg font-semibold tracking-tight">No recipes found</div>
          <div className="mt-2 text-sm text-zinc-400">
            Try clearing filters, or create your first recipe.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
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
                setMaxMinutes(180);
                setSort("newest");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((r) => {
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
