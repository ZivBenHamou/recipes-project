import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
};

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V3" />
      <path d="M7 8l5-5 5 5" />
    </svg>
  );
}

export default function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ✅ Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setNotFound(false);

    fetch(`${import.meta.env.VITE_API_URL}/recipes/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setRecipe(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function onShare() {
    if (!recipe) return;

    const url = window.location.href;

    // Mobile share (if available)
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url,
        });
        showToast("Shared ✅");
        return;
      }
    } catch {
      // user canceled / share failed -> fallback to copy
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied ✅");
    } catch {
      // last resort
      showToast("Couldn’t copy link ❌");
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">Loading recipe…</div>;
  }

  if (notFound || !recipe) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Recipe not found</div>
          <div className="mt-2 text-sm text-zinc-400">
            Try going back and selecting an existing recipe.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Toast UI */}
      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-lg">
          {toast}
        </div>
      ) : null}

      <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← Back
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative aspect-[16/7] w-full bg-zinc-900">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100">
                {recipe.category}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100">
                {recipe.prepMinutes} min
              </span>

              {/* ✅ Share button */}
              <button
                onClick={onShare}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100 hover:bg-white/15"
                aria-label="Share recipe"
                title="Share"
              >
                <ShareIcon />
                Share
              </button>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          {/* Ingredients */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold tracking-tight">Ingredients</div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-200">
              {recipe.ingredients?.length ? (
                recipe.ingredients.map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                    <span>{x}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-400">No ingredients yet.</li>
              )}
            </ul>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold tracking-tight">Instructions</div>
            <ol className="mt-3 space-y-3 text-sm text-zinc-200">
              {recipe.instructions?.length ? (
                recipe.instructions.map((x, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-200">
                      {i + 1}
                    </span>
                    <span className="pt-1">{x}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-400">No instructions yet.</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
