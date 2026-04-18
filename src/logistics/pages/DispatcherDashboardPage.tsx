import { lazy, Suspense } from 'react';
import { PageLoading } from '../../shared/components/PageLoading';

const DispatcherDashboardPageContent = lazy(() => import('./DispatcherDashboardPageContent'));

export function DispatcherDashboardPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <DispatcherDashboardPageContent />
    </Suspense>
  );
}
