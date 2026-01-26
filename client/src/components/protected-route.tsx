import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-sm text-zinc-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
