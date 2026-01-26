import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  ownerName?: string;
  ownerEmail?: string;
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

function ChefHatIcon() {
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
      <path d="M6 10c-1.7 0-3-1.3-3-3s1.3-3 3-3c.5 0 1 .1 1.4.3A4 4 0 0 1 12 2a4 4 0 0 1 4.6 2.3c.4-.2.9-.3 1.4-.3 1.7 0 3 1.3 3 3s-1.3 3-3 3" />
      <path d="M6 10v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9" />
      <path d="M9 21v-6" />
      <path d="M15 21v-6" />
    </svg>
  );
}

function kitchenKey(recipeId: string) {
  return `kitchenProgress:${recipeId}`;
}

type KitchenProgress = {
  ingredientsDone: boolean[];
  stepsDone: boolean[];
};

export default function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [kitchenMode, setKitchenMode] = useState(false);
  const [ingredientsDone, setIngredientsDone] = useState<boolean[]>([]);
  const [stepsDone, setStepsDone] = useState<boolean[]>([]);

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
    } catch {}

    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied ✅");
    } catch {
      showToast("Couldn’t copy link ❌");
    }
  }

  useEffect(() => {
    if (!recipe) return;

    const ingLen = recipe.ingredients?.length || 0;
    const stepLen = recipe.instructions?.length || 0;

    let restored: KitchenProgress | null = null;
    try {
      const raw = localStorage.getItem(kitchenKey(recipe.id));
      if (raw) restored = JSON.parse(raw);
    } catch {}

    setIngredientsDone(
      Array.from({ length: ingLen }, (_, i) => !!restored?.ingredientsDone?.[i])
    );
    setStepsDone(
      Array.from({ length: stepLen }, (_, i) => !!restored?.stepsDone?.[i])
    );
  }, [recipe]);

  useEffect(() => {
    if (!recipe) return;
    const payload: KitchenProgress = { ingredientsDone, stepsDone };
    localStorage.setItem(kitchenKey(recipe.id), JSON.stringify(payload));
  }, [recipe, ingredientsDone, stepsDone]);

  const progress = useMemo(() => {
    const total = ingredientsDone.length + stepsDone.length;
    const done =
      ingredientsDone.filter(Boolean).length +
      stepsDone.filter(Boolean).length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [ingredientsDone, stepsDone]);

  if (loading) return <div className="text-sm text-zinc-400">Loading recipe…</div>;

  if (notFound || !recipe) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Recipe not found</div>
        </div>
      </div>
    );
  }

  const author = recipe.ownerName || recipe.ownerEmail;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm">
          {toast}
        </div>
      )}

      <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← Back
      </Link>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative aspect-[16/7] bg-zinc-900">
          {recipe.imageUrl && !kitchenMode && (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                {recipe.category}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                {recipe.prepMinutes} min
              </span>

              {author && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                  By {author}
                </span>
              )}

              <button
                onClick={() => setKitchenMode((v) => !v)}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs"
              >
                <ChefHatIcon />
                {kitchenMode ? "Exit kitchen" : "Kitchen mode"}
              </button>

              <button
                onClick={onShare}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs"
              >
                <ShareIcon />
                Share
              </button>
            </div>

            <h1 className="mt-3 text-3xl font-semibold">{recipe.title}</h1>

            {kitchenMode && (
              <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-white/40"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          {/* Ingredients */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">Ingredients</div>
            <ul className="mt-3 space-y-2 text-sm">
              {recipe.ingredients.map((x, i) => (
                <li key={i}>• {x}</li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">Instructions</div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm">
              {recipe.instructions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
