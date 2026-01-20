import { Link, Route, Routes, useLocation } from "react-router-dom";

import Home from "./pages/home";
import Recipe from "./pages/recipe";
import Profile from "./pages/profile";
import AddEditRecipe from "./pages/addeditrecipe";

function NavLink({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={[
        "rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-white text-zinc-900" : "text-zinc-200 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/10" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Recipes</div>
              <div className="text-xs text-zinc-400">Personal cookbook</div>
            </div>
          </Link>

          <nav className="ml-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            <NavLink to="/" label="Home" />
            <NavLink to="/add" label="Add" />
            <NavLink to="/profile" label="Profile" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<Recipe />} />
          <Route path="/add" element={<AddEditRecipe />} />
          <Route path="/edit/:id" element={<AddEditRecipe />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<div className="text-lg">404 Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
}
