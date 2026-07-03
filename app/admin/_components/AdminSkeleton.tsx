'use client';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200/70 rounded-xl ${className}`} />
  );
}

export function LayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 flex">
      <aside className="w-64 bg-gray-900 fixed h-screen flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Shimmer className="h-9 w-32 bg-gray-800" />
        </div>
        <div className="p-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-10 bg-gray-800" />
          ))}
        </div>
      </aside>
      <main className="flex-1 ml-64">
        <header className="bg-white/80 border-b border-gray-200 px-6 py-4 flex justify-between">
          <Shimmer className="h-9 w-48" />
          <Shimmer className="h-10 w-10 rounded-xl" />
        </header>
        <div className="p-6 space-y-5">
          <Shimmer className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-28" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-7 w-64" />
        <Shimmer className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Shimmer className="h-72 lg:col-span-2" />
        <Shimmer className="h-72" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Shimmer className="h-64 lg:col-span-2" />
        <Shimmer className="h-64" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Shimmer className="h-72" />
        <Shimmer className="h-72" />
      </div>
    </div>
  );
}
