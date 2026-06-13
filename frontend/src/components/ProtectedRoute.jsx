import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute guards routes that require authentication.
 * Shows a loading spinner while checking auth, redirects to landing if not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          {/* Spinning loader */}
          <div className="w-12 h-12 border-3 border-border rounded-full border-t-primary animate-spin" />
          <p className="text-text-secondary font-body text-sm">
            Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
