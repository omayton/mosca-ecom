import { TopHeader } from '@/components/automotive/top-header'
import { AIDashboard } from '@/components/analytics/ai-dashboard'

export default function AdminAnalyticsPage() {
  return (
    <>
      <TopHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Admin</h1>
          <p className="text-zinc-600 mt-2">Monitoramento de uso e custos de IA</p>
        </div>

        <AIDashboard />
      </main>
    </>
  )
}