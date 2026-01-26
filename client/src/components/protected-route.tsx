import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-sm text-zinc-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
