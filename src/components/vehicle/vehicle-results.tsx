'use client'

import { useState, useMemo } from 'react'
import { Loader2, AlertCircle, CheckCircle2, ArrowUpDown, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CompatibleProduct, Vehicle } from '@/lib/vehicle-types'
import { pixPrice, installmentPrice } from '@/lib/products'
import Image from 'next/image'

interface VehicleResultsProps {
  vehicle: Vehicle
  products: CompatibleProduct[]
  loading: boolean
  error?: string
}

type SortOption = 'compatibility' | 'price-asc' | 'price-desc'

export function VehicleResults({ vehicle, products, loading, error }: VehicleResultsProps) {
  const router = useRouter()
  const [sortOption, setSortOption] = useState<SortOption>('compatibility')
  const [inStockOnly, setInStockOnly] = useState(false)

  const sortedProducts = useMemo(() => {
    let filtered = products

    if (inStockOnly) {
      filtered = filtered.filter(p => p.inStock)
    }

    switch (sortOption) {
      case 'price-asc':
        return [...filtered].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...filtered].sort((a, b) => b.price - a.price)
      default:
        return filtered
    }
  }, [products, sortOption, inStockOnly])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Alta'
    if (score >= 50) return 'Média'
    return 'Baixa'
  }

  const handleProductClick = (slug: string) => {
    router.push(`/produto/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" aria-hidden="true" />
        <p className="text-zinc-600 text-sm">Analisando compatibilidade com {vehicle.displayText}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-red-600 text-sm font-medium">{error}</p>
        <p className="text-zinc-500 text-xs">Tente novamente mais tarde</p>
      </div>
    )
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-8 w-8 text-zinc-400" aria-hidden="true" />
        <p className="text-zinc-600 text-sm font-medium">
          Nenhuma peça compatível encontrada para {vehicle.displayText}
        </p>
        <p className="text-zinc-500 text-xs">
          Tente buscar por outro veículo ou contate nosso suporte
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h3 className="font-semibold text-zinc-900">
            {sortedProducts.length} {sortedProducts.length === 1 ? 'peça compatível' : 'peças compatíveis'}
          </h3>
          <p className="text-xs text-zinc-500">Para {vehicle.displayText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-sm bg-white border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Ordenar resultados"
            >
              <option value="compatibility">Compatibilidade</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500"
              aria-label="Apenas em estoque"
            />
            <span className="text-sm text-zinc-700">Em estoque</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="group bg-white border border-zinc-200 rounded-lg overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleProductClick(product.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleProductClick(product.slug)
              }
            }}
            aria-label={`Ver detalhes de ${product.name}`}
          >
            <div className="relative aspect-square bg-zinc-50">
              <Image
                src={product.imageFile}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className={`
                  absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium border
                  ${getScoreColor(product.compatibilityScore)}
                `}
              >
                {getScoreLabel(product.compatibilityScore)} ({product.compatibilityScore}%)
              </div>
              {!product.inStock && (
                <div className="absolute top-2 right-2 bg-zinc-900 text-white px-2 py-1 rounded-md text-xs font-medium">
                  Esgotado
                </div>
              )}
            </div>

            <div className="p-3">
              <h4 className="font-medium text-zinc-900 text-sm line-clamp-2 mb-2 min-h-[2.5em]">
                {product.name}
              </h4>

              <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
                {product.compatibilityReason}
              </p>

              <div className="space-y-1">
                {product.oldPrice && (
                  <p className="text-xs text-zinc-400 line-through">
                    R$ {product.oldPrice.toFixed(2)}
                  </p>
                )}
                <div className="flex items-baseline gap-1">
                  <p className="text-red-600 font-barlow font-bold text-lg">
                    R$ {pixPrice(product.price)}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    à vista
                  </p>
                </div>
                <p className="text-zinc-600 text-xs">
                  em até 3x de {installmentPrice(product.price)}
                </p>
              </div>

              <button
                type="button"
                className={`
                  w-full mt-3 py-2 px-4 rounded-lg text-sm font-medium
                  transition-colors duration-150 flex items-center justify-center gap-2
                  ${product.inStock
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                  }
                `}
                disabled={!product.inStock}
                onClick={(e) => {
                  e.stopPropagation()
                  if (product.inStock) {
                    handleProductClick(product.slug)
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Ver detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}