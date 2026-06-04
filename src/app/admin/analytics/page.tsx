import { AIDashboard } from '@/components/analytics/ai-dashboard'

export default function AdminAnalyticsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Analytics IA</h1>
        <p className="text-white/30 mt-1 text-sm">Monitoramento de uso e custos de IA</p>
      </div>

      <AIDashboard />
    </div>
  )
}
