import { lazy, Suspense } from 'react';
import { PageLoading } from '../../shared/components/PageLoading';

const FuelRepairDashboardPageContent = lazy(() => import('./FuelRepairDashboardPageContent'));

export function FuelRepairDashboardPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FuelRepairDashboardPageContent />
    </Suspense>
  );
}
