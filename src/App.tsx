import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { Loader2 } from 'lucide-react';

// Lazy load feature pages
const SecretsListPage = lazy(() =>
  import('@/features/secrets/components/SecretsListPage').then((m) => ({
    default: m.SecretsListPage,
  }))
);

const SecretDetailPage = lazy(() =>
  import('@/features/secrets/components/SecretDetailPage').then((m) => ({
    default: m.SecretDetailPage,
  }))
);

function LoadingFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-vault-purple" />
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/secrets" element={<SecretsOverview />} />
            <Route path="/secrets/:mount/*" element={<SecretsRouter />} />
            <Route path="*" element={<Navigate to="/secrets" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}

function SecretsOverview() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Secrets</h1>
      <p className="text-gray-600">
        Select a secrets engine from the sidebar to browse secrets.
      </p>
    </div>
  );
}

function SecretsRouter() {
  const location = useLocation();

  // Check if there's a view query param to show detail page
  const urlParams = new URLSearchParams(location.search);
  const isViewMode = urlParams.has('view');

  // Use location as key to force remount on navigation
  const key = location.pathname + location.search;

  return isViewMode ? (
    <SecretDetailPage key={key} />
  ) : (
    <SecretsListPage key={key} />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
