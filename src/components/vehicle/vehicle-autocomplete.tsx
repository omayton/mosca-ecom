'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Car, AlertCircle } from 'lucide-react'
import type { Vehicle } from '@/lib/vehicle-types'

interface VehicleAutocompleteProps {
  onSelect: (vehicle: Vehicle) => void
  onClose: () => void
}

export function VehicleAutocomplete({ onSelect, onClose }: VehicleAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/vehicles/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (res.ok) {
          setResults(data.results)
        } else {
          setError(data.error || 'Erro ao buscar veículos')
          setResults([])
        }
      } catch (err) {
        setError('Erro de conexão. Tente novamente.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          onSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }, [results, selectedIndex, onSelect, onClose])

  const handleSelect = (vehicle: Vehicle) => {
    onSelect(vehicle)
  }

  const getBadgeColor = (index: number) => {
    if (index === selectedIndex) return 'bg-red-50 border-red-500'
    return 'hover:bg-zinc-50 border-transparent'
  }

  return (
    <div className="w-full">
      <div className="relative">
        <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite marca, modelo (ex: VW Gol 2020)"
          autoComplete="off"
          className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          aria-label="Buscar veículo"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="vehicle-results-list"
          aria-autocomplete="list"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" aria-hidden="true" />
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && !loading && (
        <ul
          ref={listRef}
          id="vehicle-results-list"
          role="listbox"
          className="mt-2 max-h-80 overflow-y-auto border border-zinc-200 rounded-lg bg-white shadow-sm"
        >
          {results.map((vehicle, index) => (
            <li
              key={vehicle.fipeCode || `${vehicle.brand}-${vehicle.model}-${vehicle.year}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(vehicle)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                px-4 py-3 cursor-pointer transition-colors duration-150 border-b last:border-b-0
                ${getBadgeColor(index)}
              `}
            >
              <div className="flex items-center gap-3">
                <Car className="h-4 w-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 text-sm truncate">
                    {vehicle.displayText}
                  </p>
                  {vehicle.brand && vehicle.model && vehicle.year && (
                    <p className="text-xs text-zinc-500">
                      {vehicle.brand} • {vehicle.model} • {vehicle.year}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && results.length === 0 && query.trim().length >= 2 && (
        <div className="mt-3 text-center text-sm text-zinc-500">
          Nenhum veículo encontrado. Tente outra busca.
        </div>
      )}
    </div>
  )
}