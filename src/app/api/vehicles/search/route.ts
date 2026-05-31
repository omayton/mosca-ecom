import { NextRequest, NextResponse } from 'next/server'
import type { Vehicle, VehicleSearchResponse } from '@/lib/vehicle-types'

const FIPE_API_URL = 'https://brasilapi.com.br/api/fipe/marcas/v1'

interface CacheEntry {
  vehicles: Vehicle[]
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000
const MAX_CACHE_SIZE = 50

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function getCacheKey(query: string): string {
  return normalizeText(query)
}

function getCachedResults(query: string): Vehicle[] | null {
  const key = getCacheKey(query)
  const entry = cache.get(key)

  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.vehicles
}

function setCachedResults(query: string, vehicles: Vehicle[]): void {
  const key = getCacheKey(query)

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }

  cache.set(key, {
    vehicles,
    timestamp: Date.now()
  })
}

function getFallbackVehicles(query: string): Vehicle[] {
  const normalizedQuery = normalizeText(query)

  const brazilianVehicles = [
    { brand: 'Volkswagen', model: 'Gol', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Polo', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Virtus', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Nivus', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'T-Cross', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Tiguan', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Jetta', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Saveiro', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Amarok', year: '2020-2024' },
    { brand: 'Volkswagen', model: 'Golf', year: '2010-2021' },
    { brand: 'Fiat', model: 'Uno', year: '2010-2024' },
    { brand: 'Fiat', model: 'Mobi', year: '2016-2024' },
    { brand: 'Fiat', model: 'Argo', year: '2017-2024' },
    { brand: 'Fiat', model: 'Cronos', year: '2018-2024' },
    { brand: 'Fiat', model: 'Toro', year: '2016-2024' },
    { brand: 'Fiat', model: 'Strada', year: '2020-2024' },
    { brand: 'Chevrolet', model: 'Onix', year: '2012-2024' },
    { brand: 'Chevrolet', model: 'Prisma', year: '2013-2019' },
    { brand: 'Chevrolet', model: 'Tracker', year: '2020-2024' },
    { brand: 'Chevrolet', model: 'Spin', year: '2012-2024' },
    { brand: 'Chevrolet', model: 'Cruze', year: '2011-2024' },
    { brand: 'Chevrolet', model: 'Cobalt', year: '2012-2020' },
    { brand: 'Chevrolet', model: 'Sonic', year: '2012-2017' },
    { brand: 'Chevrolet', model: 'Montana', year: '2023-2024' },
    { brand: 'Ford', model: 'Ka', year: '2014-2024' },
    { brand: 'Ford', model: 'EcoSport', year: '2014-2024' },
    { brand: 'Ford', model: 'Focus', year: '2014-2019' },
    { brand: 'Ford', model: 'Fiesta', year: '2014-2019' },
    { brand: 'Ford', model: 'Ranger', year: '2012-2024' },
    { brand: 'Honda', model: 'Fit', year: '2014-2022' },
    { brand: 'Honda', model: 'Civic', year: '2012-2024' },
    { brand: 'Honda', model: 'City', year: '2014-2024' },
    { brand: 'Honda', model: 'HR-V', year: '2015-2024' },
    { brand: 'Toyota', model: 'Corolla', year: '2014-2024' },
    { brand: 'Toyota', model: 'Yaris', year: '2018-2024' },
    { brand: 'Toyota', model: 'Etios', year: '2012-2021' },
    { brand: 'Toyota', model: 'Hilux', year: '2016-2024' },
    { brand: 'Hyundai', model: 'HB20', year: '2012-2024' },
    { brand: 'Hyundai', model: 'Creta', year: '2016-2024' },
    { brand: 'Hyundai', model: 'Tucson', year: '2015-2024' },
    { brand: 'Renault', model: 'Sandero', year: '2014-2024' },
    { brand: 'Renault', model: 'Kwid', year: '2015-2024' },
    { brand: 'Renault', model: 'Duster', year: '2011-2024' },
    { brand: 'Renault', model: 'Captur', year: '2017-2024' },
    { brand: 'Peugeot', model: '208', year: '2013-2024' },
    { brand: 'Peugeot', model: '2008', year: '2013-2024' },
    { brand: 'Peugeot', model: '3008', year: '2010-2024' },
  ]

  return brazilianVehicles
    .filter(vehicle => {
      const text = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      return normalizeText(text).includes(normalizedQuery)
    })
    .map(vehicle => ({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fipeCode: 'fallback',
      displayText: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
    }))
    .slice(0, 8)
}

async function fetchVehiclesFromFipe(query: string): Promise<Vehicle[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${FIPE_API_URL}`, {
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Fipe API failed: ${res.status}`)
    }

    const brands = await res.json()
    const normalizedQuery = normalizeText(query)

    const matchedBrands = brands.filter((brand: any) =>
      normalizeText(brand.nome).includes(normalizedQuery)
    )

    const vehicles: Vehicle[] = []

    for (const brand of matchedBrands.slice(0, 5)) {
      try {
        const modelsRes = await fetch(
          `${FIPE_API_URL}/${brand.codigo}/modelos`,
          { signal: controller.signal }
        )

        if (!modelsRes.ok) continue

        const modelsData = await modelsRes.json()
        const models = modelsData.modelos || []

        const matchedModels = models
          .filter((model: any) => normalizeText(model.nome).includes(normalizedQuery))
          .slice(0, 3)

        for (const model of matchedModels) {
          try {
            const yearsRes = await fetch(
              `${FIPE_API_URL}/${brand.codigo}/modelos/${model.codigo}/anos`,
              { signal: controller.signal }
            )

            if (!yearsRes.ok) continue

            const years = await yearsRes.json()

            const recentYears = years
              .filter((y: any) => !y.nome.includes('32000'))
              .slice(-3)

            for (const year of recentYears) {
              vehicles.push({
                brand: brand.nome,
                model: model.nome,
                year: year.nome.split(' ')[0],
                fipeCode: `${brand.codigo}-${model.codigo}-${year.codigo}`,
                displayText: `${brand.nome} ${model.nome} ${year.nome.split(' ')[0]}`
              })
            }
          } catch {
            continue
          }
        }
      } catch {
        continue
      }
    }

    return vehicles.slice(0, 8)
  } catch (error) {
    console.error('Fipe API error:', error)
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json<Partial<VehicleSearchResponse>>({
        results: [],
        cached: false
      })
    }

    const cachedResults = getCachedResults(query)
    if (cachedResults) {
      return NextResponse.json<VehicleSearchResponse>({
        results: cachedResults,
        cached: true
      })
    }

    const vehicles = await fetchVehiclesFromFipe(query)

    if (vehicles.length === 0) {
      const fallbackVehicles = getFallbackVehicles(query)
      setCachedResults(query, fallbackVehicles)

      return NextResponse.json<VehicleSearchResponse>({
        results: fallbackVehicles,
        cached: false
      })
    }

    setCachedResults(query, vehicles)

    return NextResponse.json<VehicleSearchResponse>({
      results: vehicles,
      cached: false
    })
  } catch (error) {
    console.error('Vehicle search error:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar veículos. Tente novamente.' },
      { status: 500 }
    )
  }
}