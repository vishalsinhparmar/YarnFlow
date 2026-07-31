import { Shield } from 'lucide-react';

const AppInitializationLoader = () => (
  <main
    aria-label="Initializing YarnFlow"
    aria-live="polite"
    className="flex min-h-screen items-center justify-center bg-gray-100 px-4"
  >
    <section className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-7 shadow-lg sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
          <Shield aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-950">YarnFlow</p>
          <p className="text-sm text-gray-500">Management System</p>
        </div>
        <span className="ml-auto rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
          ERP
        </span>
      </div>

      <div className="mt-7 border-t border-gray-200 pt-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-800">Preparing your workspace</p>
          <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-500" />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div className="yarnflow-loader-progress h-full w-2/5 rounded-full bg-orange-600" />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Verifying your session and loading business data.
        </p>
      </div>
    </section>
  </main>
);

export default AppInitializationLoader;
