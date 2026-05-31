'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { VehicleAutocomplete } from './vehicle-autocomplete'
import { VehicleResults } from './vehicle-results'
import type { Vehicle, CompatibleProduct } from '@/lib/vehicle-types'

interface VehicleSearchDropdownProps {
  isOpen: boolean
  onClose: () => void
  initialVehicle?: Vehicle | null
}

export function VehicleSearchDropdown({
  isOpen,
  onClose,
  initialVehicle
}: VehicleSearchDropdownProps) {
  const [step, setStep] = useState<'search' | 'results'>('search')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(initialVehicle || null)
  const [products, setProducts] = useState<CompatibleProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (initialVehicle && isOpen) {
      setSelectedVehicle(initialVehicle)
      setStep('results')
      fetchCompatibility(initialVehicle)
    } else {
      setStep('search')
      setSelectedVehicle(null)
      setProducts([])
      setError(null)
    }
  }, [initialVehicle, isOpen])

  const handleVehicleSelect = useCallback(async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setStep('results')
    await fetchCompatibility(vehicle)
  }, [])

  const fetchCompatibility = async (vehicle: Vehicle) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/vehicles/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle })
      })

      const data = await res.json()

      if (res.ok) {
        setProducts(data.compatibleProducts)
      } else {
        setError(data.error || 'Erro ao analisar compatibilidade')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSearch = useCallback(() => {
    setStep('search')
    setSelectedVehicle(null)
    setProducts([])
    setError(null)
  }, [])

  const handleNewSearch = useCallback(() => {
    setStep('search')
    setProducts([])
    setError(null)
  }, [])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="fixed left-0 right-0 mx-auto max-w-[600px] w-[min(calc(100vw-2rem),600px)] max-h-[80vh] bg-white border border-zinc-200 rounded-lg shadow-lg z-[100] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar por veículo"
      >
      <div className="sticky top-0 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900">
          {step === 'search' ? 'Buscar por veículo' : 'Peças compatíveis'}
        </h2>
        <div className="flex items-center gap-2">
          {step === 'results' && selectedVehicle && (
            <button
              type="button"
              onClick={handleNewSearch}
              className="text-sm text-red-600 hover:text-red-700 transition-colors duration-150"
            >
              Nova busca
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors duration-150"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        {step === 'search' ? (
          <VehicleAutocomplete
            onSelect={handleVehicleSelect}
            onClose={onClose}
          />
        ) : (
          selectedVehicle && (
            <VehicleResults
              vehicle={selectedVehicle}
              products={products}
              loading={loading}
              error={error || undefined}
            />
          )
        )}
      </div>
      </div>
    </>
  )
}