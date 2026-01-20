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

export default function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
