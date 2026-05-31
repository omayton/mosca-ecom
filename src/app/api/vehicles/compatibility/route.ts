import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/products-db'
import { createClient } from '@supabase/supabase-js'
import type {
  CompatibleProduct,
  CompatibilityResponse,
  CompatibilityRequest
} from '@/lib/vehicle-types'

const HAIKU_PRICE_PER_1K_INPUT = 0.00025
const HAIKU_PRICE_PER_1K_OUTPUT = 0.00125

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getCacheKey(brand: string, model: string, year: string): string {
  return `${brand.toLowerCase()}-${model.toLowerCase()}-${year}`.replace(/\s+/g, '-')
}

function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1000) * HAIKU_PRICE_PER_1K_INPUT +
    (outputTokens / 1000) * HAIKU_PRICE_PER_1K_OUTPUT
  )
}

function calculateCompatibilityScore(
  description: string,
  brand: string,
  model: string,
  year: string
): { score: number; reason: string } {
  const desc = description.toLowerCase()
  const brandLower = brand.toLowerCase()
  const modelLower = model.toLowerCase()

  let score = 0
  const reasons: string[] = []

  if (desc.includes(brandLower)) {
    score += 30
    reasons.push(`Marca ${brand} compatível`)
  }

  if (desc.includes(modelLower)) {
    score += 40
    reasons.push(`Modelo ${model} mencionado`)
  }

  if (desc.includes(year) || desc.includes(`ano ${year}`)) {
    score += 20
    reasons.push(`Ano ${year} compatível`)
  }

  if (desc.includes('universal')) {
    score = Math.max(score, 60)
    reasons.push('Peça universal')
  }

  if (desc.includes('compatível') || desc.includes('compativel')) {
    score += 15
  }

  if (reasons.length === 0) {
    return {
      score: 0,
      reason: 'Sem indicação de compatibilidade'
    }
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join('. ')
  }
}

async function analyzeWithAI(
  products: any[],
  brand: string,
  model: string,
  year: string
): Promise<{ products: CompatibleProduct[]; inputTokens: number; outputTokens: number }> {
  const AI_GATEWAY_URL = process.env.VERCEL_AI_GATEWAY_URL
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!AI_GATEWAY_URL || !ANTHROPIC_API_KEY) {
    console.warn('AI credentials not configured, using fallback')
    throw new Error('AI not configured')
  }

  const productsSummary = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description
  }))

  const prompt = `You are an automotive parts compatibility expert. Analyze these products and determine compatibility with a ${brand} ${model} (${year}).

For each product, provide:
1. Compatibility score (0-100, where 100 is perfect match)
2. Brief reason explaining compatibility or incompatibility

Products to analyze:
${JSON.stringify(productsSummary, null, 2)}

Return ONLY valid JSON in this format:
{
  "results": [
    {
      "productId": 123,
      "compatibilityScore": 85,
      "compatibilityReason": "Compatible - esse painel é universal para compactos"
    }
  ]
}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(`${AI_GATEWAY_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`AI API failed: ${res.status}`)
    }

    const data = await res.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content from AI')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response')
    }

    const aiResults = JSON.parse(jsonMatch[0])

    const products = aiResults.results.map((result: any) => {
      const product = products.find((p: any) => p.id === result.productId)
      if (!product) return null

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.old_price,
        category: product.category,
        imageFile: product.image_file,
        slug: product.slug,
        compatibilityScore: result.compatibilityScore,
        compatibilityReason: result.compatibilityReason,
        inStock: product.in_stock
      }
    }).filter((p: CompatibleProduct | null): p is CompatibleProduct => p !== null)

    return {
      products,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    throw error
  }
}

function analyzeWithFallback(
  products: any[],
  brand: string,
  model: string,
  year: string
): CompatibleProduct[] {
  return products.map(product => {
    const { score, reason } = calculateCompatibilityScore(
      product.description,
      brand,
      model,
      year
    )

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.old_price,
      category: product.category,
      imageFile: product.image_file,
      slug: product.slug,
      compatibilityScore: score,
      compatibilityReason: reason,
      inStock: product.in_stock
    }
  }).filter(p => p.compatibilityScore > 0)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}

async function logAnalytics(data: {
  sessionId?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleYear?: string
  modelUsed: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  responseTimeMs: number
  cacheHit: boolean
  fallbackUsed: boolean
  productsAnalyzed: number
}) {
  try {
    const supabase = getSupabaseClient()
    await supabase.from('ai_analytics').insert({
      session_id: data.sessionId,
      vehicle_brand: data.vehicleBrand,
      vehicle_model: data.vehicleModel,
      vehicle_year: data.vehicleYear,
      model_used: data.modelUsed,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      estimated_cost_usd: data.estimatedCostUsd,
      response_time_ms: data.responseTimeMs,
      cache_hit: data.cacheHit,
      fallback_used: data.fallbackUsed,
      products_analyzed: data.productsAnalyzed
    })
  } catch (error) {
    console.error('Failed to log analytics:', error)
  }
}

async function getCachedResults(brand: string, model: string, year: string) {
  try {
    const supabase = getSupabaseClient()
    const cacheKey = getCacheKey(brand, model, year)

    const { data, error } = await supabase
      .from('vehicle_compatibility_cache')
      .select('cached_results, hit_count, id')
      .eq('cache_key', cacheKey)
      .single()

    if (error || !data) return null

    await supabase
      .from('vehicle_compatibility_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('id', data.id)

    return data.cached_results as CompatibleProduct[]
  } catch (error) {
    console.error('Cache error:', error)
    return null
  }
}

async function setCachedResults(
  brand: string,
  model: string,
  year: string,
  results: CompatibleProduct[],
  totalProducts: number
) {
  try {
    const supabase = getSupabaseClient()
    const cacheKey = getCacheKey(brand, model, year)

    await supabase
      .from('vehicle_compatibility_cache')
      .insert({
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_year: year,
        cached_results: results,
        cache_key: cacheKey,
        total_products: totalProducts
      })
  } catch (error) {
    console.error('Failed to cache results:', error)
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const sessionId = req.headers.get('x-session-id') || undefined

  try {
    const body: CompatibilityRequest = await req.json()
    const { vehicle } = body

    if (!vehicle || !vehicle.brand || !vehicle.model || !vehicle.year) {
      return NextResponse.json(
        { error: 'Veículo inválido. Informe marca, modelo e ano.' },
        { status: 400 }
      )
    }

    const cachedResults = await getCachedResults(vehicle.brand, vehicle.model, vehicle.year)

    if (cachedResults) {
      await logAnalytics({
        sessionId,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        vehicleYear: vehicle.year,
        modelUsed: 'cache',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        responseTimeMs: Date.now() - startTime,
        cacheHit: true,
        fallbackUsed: false,
        productsAnalyzed: cachedResults.length
      })

      return NextResponse.json({
        compatibleProducts: cachedResults,
        analysisMetadata: {
          totalProducts: cachedResults.length,
          analyzedAt: new Date().toISOString(),
          fallbackUsed: false,
          cached: true
        }
      })
    }

    const allProducts = await getProducts()

    let compatibleProducts: CompatibleProduct[]
    let fallbackUsed = false
    let aiUsed = false
    let inputTokens = 0
    let outputTokens = 0

    try {
      const result = await analyzeWithAI(
        allProducts.slice(0, 50),
        vehicle.brand,
        vehicle.model,
        vehicle.year
      )
      compatibleProducts = result.products
      inputTokens = result.inputTokens || 0
      outputTokens = result.outputTokens || 0
      aiUsed = true

      await setCachedResults(vehicle.brand, vehicle.model, vehicle.year, compatibleProducts, allProducts.length)
    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error)
      compatibleProducts = analyzeWithFallback(
        allProducts,
        vehicle.brand,
        vehicle.model,
        vehicle.year
      )
      fallbackUsed = true
    }

    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens)

    await logAnalytics({
      sessionId,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      modelUsed: aiUsed ? 'claude-haiku-4-5-20251001' : 'fallback-keyword',
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimatedCost,
      responseTimeMs: Date.now() - startTime,
      cacheHit: false,
      fallbackUsed,
      productsAnalyzed: compatibleProducts.length
    })

    const response: CompatibilityResponse = {
      compatibleProducts,
      analysisMetadata: {
        totalProducts: allProducts.length,
        analyzedAt: new Date().toISOString(),
        fallbackUsed
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Compatibility analysis error:', error)

    return NextResponse.json(
      { error: 'Erro ao analisar compatibilidade. Tente novamente.' },
      { status: 500 }
    )
  }
}