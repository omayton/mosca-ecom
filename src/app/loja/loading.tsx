export default function LojaLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header placeholder */}
      <div className="h-[140px] bg-zinc-950" />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-zinc-200 rounded mb-6 animate-pulse" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar skeleton */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="h-11 bg-zinc-200 rounded-lg mb-4 animate-pulse" />
            <div className="hidden lg:block space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-9 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </aside>

          {/* Products grid skeleton */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-48 bg-zinc-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-zinc-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-3 bg-zinc-100 rounded w-2/3 animate-pulse" />
                    <div className="h-5 bg-zinc-200 rounded w-1/2 animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
