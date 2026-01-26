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

function Checkbox({
  checked,
  onChange,
  label,
  big,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-xl border border-white/10 px-3 py-3 text-left transition hover:bg-white/5 ${
        big ? "text-base" : "text-sm"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? "border-white/30 bg-white/20"
            : "border-white/15 bg-white/5"
        }`}
      >
        {checked ? (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : null}
      </span>

      <span className={checked ? "text-zinc-300 line-through" : "text-zinc-100"}>
        {label}
      </span>
    </button>
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

  // ✅ Toast
  const [toast, setToast] = useState<string | null>(null);

  // ✅ Kitchen Mode
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
    } catch {
      // fall back to copy
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied ✅");
    } catch {
      showToast("Couldn’t copy link ❌");
    }
  }

  // ✅ init / restore kitchen progress once recipe loads
  useEffect(() => {
    if (!recipe) return;

    const ingLen = recipe.ingredients?.length || 0;
    const stepLen = recipe.instructions?.length || 0;

    let restored: KitchenProgress | null = null;
    try {
      const raw = localStorage.getItem(kitchenKey(recipe.id));
      if (raw) restored = JSON.parse(raw);
    } catch {
      restored = null;
    }

    const safeIngredients = Array.from({ length: ingLen }, (_, i) => !!restored?.ingredientsDone?.[i]);
    const safeSteps = Array.from({ length: stepLen }, (_, i) => !!restored?.stepsDone?.[i]);

    setIngredientsDone(safeIngredients);
    setStepsDone(safeSteps);
  }, [recipe]);

  // ✅ persist kitchen progress
  useEffect(() => {
    if (!recipe) return;
    const payload: KitchenProgress = { ingredientsDone, stepsDone };
    try {
      localStorage.setItem(kitchenKey(recipe.id), JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [recipe, ingredientsDone, stepsDone]);

  const progress = useMemo(() => {
    const total = (ingredientsDone?.length || 0) + (stepsDone?.length || 0);
    const done =
      ingredientsDone.filter(Boolean).length + stepsDone.filter(Boolean).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [ingredientsDone, stepsDone]);

  function clearProgress() {
    if (!recipe) return;
    const ok = confirm("Reset kitchen progress?");
    if (!ok) return;

    setIngredientsDone(Array.from({ length: recipe.ingredients?.length || 0 }, () => false));
    setStepsDone(Array.from({ length: recipe.instructions?.length || 0 }, () => false));

    try {
      localStorage.removeItem(kitchenKey(recipe.id));
    } catch {
      // ignore
    }
    showToast("Progress reset ✅");
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
      <div className={`overflow-hidden rounded-3xl border border-white/10 ${kitchenMode ? "bg-black" : "bg-white/5"}`}>
        <div className="relative aspect-[16/7] w-full bg-zinc-900">
          {recipe.imageUrl && !kitchenMode ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100">
                {recipe.category}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100">
                {recipe.prepMinutes} min
              </span>

              {/* ✅ Kitchen mode */}
              <button
                onClick={() => setKitchenMode((v) => !v)}
                className={`ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/15 ${
                  kitchenMode ? "bg-white/15 text-white" : "bg-white/10 text-zinc-100"
                }`}
                aria-label="Toggle kitchen mode"
                title="Kitchen mode"
              >
                <ChefHatIcon />
                {kitchenMode ? "Exit kitchen" : "Kitchen mode"}
              </button>

              {/* ✅ Share button */}
              <button
                onClick={onShare}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100 hover:bg-white/15"
                aria-label="Share recipe"
                title="Share"
              >
                <ShareIcon />
                Share
              </button>
            </div>

            <h1 className={`mt-3 font-semibold tracking-tight ${kitchenMode ? "text-4xl" : "text-3xl"}`}>
              {recipe.title}
            </h1>

            {kitchenMode ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="h-2 w-44 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-white/40"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-200">
                  {progress.done}/{progress.total} • {progress.pct}%
                </div>

                <button
                  onClick={clearProgress}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-zinc-100 hover:bg-white/15"
                >
                  Reset
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className={`grid gap-6 p-6 lg:grid-cols-2 ${kitchenMode ? "bg-black" : ""}`}>
          {/* Ingredients */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className={`font-semibold tracking-tight ${kitchenMode ? "text-base" : "text-sm"}`}>
              Ingredients
            </div>

            <div className="mt-3 space-y-2">
              {recipe.ingredients?.length ? (
                recipe.ingredients.map((x, i) => (
                  <Checkbox
                    key={i}
                    big={kitchenMode}
                    checked={!!ingredientsDone[i]}
                    onChange={(next) =>
                      setIngredientsDone((prev) => {
                        const copy = [...prev];
                        copy[i] = next;
                        return copy;
                      })
                    }
                    label={x}
                  />
                ))
              ) : (
                <div className="text-sm text-zinc-400">No ingredients yet.</div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className={`font-semibold tracking-tight ${kitchenMode ? "text-base" : "text-sm"}`}>
              Instructions
            </div>

            <div className="mt-3 space-y-2">
              {recipe.instructions?.length ? (
                recipe.instructions.map((x, i) => (
                  <Checkbox
                    key={i}
                    big={kitchenMode}
                    checked={!!stepsDone[i]}
                    onChange={(next) =>
                      setStepsDone((prev) => {
                        const copy = [...prev];
                        copy[i] = next;
                        return copy;
                      })
                    }
                    label={
                      <span className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-200">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{x}</span>
                      </span>
                    }
                  />
                ))
              ) : (
                <div className="text-sm text-zinc-400">No instructions yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
