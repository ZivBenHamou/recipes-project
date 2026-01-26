import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/auth";

type Recipe = {
  id: string;
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  ownerId?: string;
};

type RecipePayload = {
  title: string;
  category: string;
  prepMinutes: number;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
};

export default function AddEditRecipe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { getToken } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [prepMinutes, setPrepMinutes] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing recipe for edit (public endpoint)
  useEffect(() => {
    if (!isEdit || !id) return;

    setLoadingExisting(true);
    setError(null);

    fetch(`${import.meta.env.VITE_API_URL}/recipes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Recipe not found");
        return r.json();
      })
      .then((data: Recipe) => {
        setTitle(data.title || "");
        setCategory(data.category || "");
        setPrepMinutes(Number(data.prepMinutes) || 0);
        setImageUrl(data.imageUrl || "");
        setIngredientsText((data.ingredients || []).join("\n"));
        setInstructionsText((data.instructions || []).join("\n"));
      })
      .catch((err: any) => setError(err?.message || "Failed to load recipe"))
      .finally(() => setLoadingExisting(false));
  }, [isEdit, id]);

  const payload: RecipePayload = useMemo(() => {
    const ingredients = ingredientsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const instructions = instructionsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      title: title.trim(),
      category: category.trim(),
      prepMinutes: Number(prepMinutes) || 0,
      imageUrl: imageUrl.trim(),
      ingredients,
      instructions,
    };
  }, [title, category, prepMinutes, imageUrl, ingredientsText, instructionsText]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!payload.title || !payload.category) {
      setError("Title and Category are required");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        localStorage.setItem("toast", "Please login first 🔐");
        navigate("/login");
        return;
      }

      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/recipes/${id}`
        : `${import.meta.env.VITE_API_URL}/recipes`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.setItem("toast", "Session expired — please login again 🔐");
        navigate("/login");
        return;
      }

      if (res.status === 403) {
        throw new Error("You can only edit your own recipes.");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to save recipe");
      }

      const saved = await res.json();

      // ✅ Toast message for Home
      localStorage.setItem(
        "toast",
        isEdit ? "Recipe updated ✅" : "Recipe created ✅"
      );

      navigate(`/recipe/${saved.id}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit recipe" : "Add recipe"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isEdit ? "Update your recipe details." : "Create a new recipe."}
          </p>
        </div>

        <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back
        </Link>
      </div>

      {loadingExisting ? (
        <div className="text-sm text-zinc-400">Loading recipe…</div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* Left */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400">Title *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="e.g. Pasta Pomodoro"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Category *</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="e.g. Italian"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Prep minutes</label>
                  <input
                    type="number"
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400">Image URL</label>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Paste an image link (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="text-xs text-zinc-400">
                Ingredients (one per line)
              </label>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="text-xs text-zinc-400">
                Instructions (one per line)
              </label>
              <textarea
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                rows={6}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold tracking-tight">Preview</div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                <div className="aspect-[16/10] w-full bg-zinc-900">
                  {payload.imageUrl ? (
                    <img
                      src={payload.imageUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      No image
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold">
                      {payload.title || "Recipe title"}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                      {payload.prepMinutes || 0} min
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {payload.category || "Category"}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
                type="submit"
              >
                {loading ? "Saving..." : isEdit ? "Save changes" : "Create recipe"}
              </button>

              <p className="mt-3 text-xs text-zinc-500">
                * Required fields: Title, Category
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
