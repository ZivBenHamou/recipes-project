const KEY = "favoriteRecipes";

export function getFavorites(): string[] {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function isFavorite(id: string) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string) {
  const favs = getFavorites();
  const updated = favs.includes(id)
    ? favs.filter(f => f !== id)
    : [...favs, id];

  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
