import { AIDashboard } from '@/components/analytics/ai-dashboard'

export default function AdminAnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Analytics IA</h1>
        <p className="text-zinc-500 mt-1">Monitoramento de uso e custos de IA</p>
      </div>

      <AIDashboard />
    </div>
  )
}